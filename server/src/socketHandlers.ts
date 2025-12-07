import { Server, Socket } from 'socket.io';
import { GameState, Player, Card } from './types';
import { generateRoomId, getSetName, getSetCards, generateDeck, shuffleArray, assignTeams, distributeCards } from './utils';

// A map storing all active game rooms by roomId
const rooms = new Map<string, GameState>();

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        // Creates a new room, makes the creator the owner
        socket.on('create_game', ({ playerName, playerId }: { playerName: string; playerId: string }) => {
            const roomId = generateRoomId();
            const newPlayer: Player = {
                id: socket.id,
                playerId: playerId,
                name: playerName,
                hand: [],
                team: null,
                isOwner: true
            };

            const newGame: GameState = {
                roomId: roomId,
                status: 'LOBBY',
                players: [newPlayer],
                gameData: {
                    turnIndex: 0,
                    teams: {
                        A: { score: 0 },
                        B: { score: 0 }
                    },
                    log: [],
                    completedSets: [],
                    turnState: 'NORMAL'
                }
            };

            rooms.set(roomId, newGame); // Store game data in map
            socket.join(roomId);        // Join the Socket.IO room

            socket.emit('game_created', { roomId, playerName });
            io.to(roomId).emit('player_update', newGame.players);
            console.log(`Game created: ${roomId} by ${playerName}`);
        });


        // Joins existing room, or reconnects if player already exists (by playerId)
        socket.on('join_game', ({ roomCode, playerName, playerId }: { roomCode: string; playerName: string; playerId: string }) => {
            const game = rooms.get(roomCode);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Check if player with same playerId already exists (reconnection)
            const existingPlayer = game.players.find(p => p.playerId === playerId);

            if (existingPlayer) {
                // Player is reconnecting, update their socket.id
                existingPlayer.id = socket.id;
                socket.join(roomCode);

                // If game is in progress, send game state
                if (game.status === 'IN_GAME') {
                    io.to(socket.id).emit('game_started_personal', {
                        hand: existingPlayer.hand,
                        turnIndex: game.gameData.turnIndex,
                        players: game.players.map(p => ({
                            id: p.id,
                            playerId: p.playerId,
                            name: p.name,
                            team: p.team,
                            isOwner: p.isOwner,
                            cardCount: p.hand.length
                        })),
                        myTeam: existingPlayer.team
                    });
                    console.log(`${playerName} rejoined in-progress game ${roomCode}`);
                } else {
                    // Game is in lobby
                    io.to(roomCode).emit('player_update', game.players);
                    socket.emit('joined_game', { roomId: roomCode, playerName });
                    console.log(`${playerName} reconnected to ${roomCode}`);
                }
                return;
            }

            // New player trying to join, only allow if game is in lobby
            if (game.status !== 'LOBBY') {
                socket.emit('error', { message: 'Game already started' });
                return;
            }

            const newPlayer: Player = {
                id: socket.id,
                playerId: playerId,
                name: playerName,
                hand: [],
                team: null,
                isOwner: false
            };

            game.players.push(newPlayer);
            socket.join(roomCode);

            io.to(roomCode).emit('player_update', game.players);
            socket.emit('joined_game', { roomId: roomCode, playerName });
            console.log(`${playerName} joined ${roomCode}`);
        });


        // Starts the game, only room owner can start
        socket.on('start_game', ({ roomId, playerId }: { roomId: string; playerId: string }) => {
            const game = rooms.get(roomId);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Verify the player is the owner (use playerId)
            const player = game.players.find(p => p.playerId === playerId);
            if (!player || !player.isOwner) {
                socket.emit('error', { message: 'You are not the owner of this game' });
                return;
            }

            // Update the player's socket.id to current socket (in case of reconnection)
            player.id = socket.id;

            if (game.players.length < 4) {
                // Minimum 4 players for Literature
                // For testing purposes during development, allow fewer
                // socket.emit('error', { message: 'Need at least 4 players' });
                // return;
            }

            // Setup game
            assignTeams(game.players);
            const deck = shuffleArray(generateDeck());
            distributeCards(deck, game.players);

            // Set game state
            game.status = 'IN_GAME';
            game.gameData.turnIndex = Math.floor(Math.random() * game.players.length);

            // Game Started
            io.to(game.roomId).emit('game_started', {
                turnIndex: game.gameData.turnIndex,
                players: game.players
            });

            // Send specific data to each client
            game.players.forEach(p => {
                io.to(p.id).emit('game_started_personal', {
                    hand: p.hand,
                    turnIndex: game.gameData.turnIndex,
                    players: game.players.map(pl => ({
                        id: pl.id,
                        playerId: pl.playerId,
                        name: pl.name,
                        team: pl.team,
                        isOwner: pl.isOwner,
                        cardCount: pl.hand.length
                    })),
                    myTeam: p.team
                });
            });

            console.log(`Game started in room ${game.roomId}`);
        });


        // Ask opponent for a card
        socket.on('ask_card', ({ roomId, targetId, card }: { roomId: string, targetId: string, card: Card }) => {
            const game = rooms.get(roomId);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Find player and validate turn
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex === -1) {
                socket.emit('error', { message: 'You are not in this game' });
                return;
            }

            if (game.gameData.turnIndex !== playerIndex) {
                socket.emit('error', { message: "It's not your turn" });
                return;
            }

            const player = game.players[playerIndex];

            // Validate target (use playerId for stable identification after reconnects)
            const targetIndex = game.players.findIndex(p => p.playerId === targetId);
            if (targetIndex === -1) {
                socket.emit('error', { message: 'Target player not found' });
                return;
            }

            const target = game.players[targetIndex];

            if (player.team === target.team) {
                socket.emit('error', { message: 'Cannot ask teammate' });
                return;
            }

            if (target.hand.length === 0) {
                socket.emit('error', { message: 'Target has no cards' });
                return;
            }

            // Validate player has a card from the same set
            const requestedSet = getSetName(card);
            if (!player.hand.some(c => getSetName(c) === requestedSet)) {
                socket.emit('error', { message: `You must have a card from the "${requestedSet}" set to ask` });
                return;
            }

            // Validate player doesn't already have the card
            if (player.hand.some(c => c.suit === card.suit && c.rank === card.rank)) {
                socket.emit('error', { message: 'You already have this card' });
                return;
            }

            // Check if target has the card
            const cardIndex = target.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
            const success = cardIndex !== -1;

            // Update game state
            game.gameData.lastAsk = {
                askerName: player.name,
                targetName: target.name,
                card,
                success
            };

            if (success) {
                // Transfer card from target to player
                const [transferredCard] = target.hand.splice(cardIndex, 1);
                player.hand.push(transferredCard);
                game.gameData.log.push(`${player.name} took ${card.rank} of ${card.suit} from ${target.name}`);
            } else {
                // Turn passes to target
                game.gameData.turnIndex = targetIndex;
                game.gameData.log.push(`${player.name} asked ${target.name} for ${card.rank} of ${card.suit} and missed`);
            }

            emitGameState(game, io);
        });


        // Declare/claim a set
        socket.on('declare_set', ({ roomId, declaration }: { roomId: string, declaration: { card: Card, playerId: string }[] }) => {
            const game = rooms.get(roomId);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Find player
            const player = game.players.find(p => p.id === socket.id);
            if (!player) {
                socket.emit('error', { message: 'You are not in this game' });
                return;
            }

            // Validate declaration is not empty
            if (declaration.length === 0) {
                socket.emit('error', { message: 'Declaration cannot be empty' });
                return;
            }

            // Get expected set based on first card
            const setName = getSetName(declaration[0].card);
            const expectedSet = getSetCards(setName);

            // Validate declaration has correct number of cards
            if (declaration.length !== expectedSet.length) {
                socket.emit('error', { message: `Set "${setName}" requires ${expectedSet.length} cards` });
                return;
            }

            // Validate all cards in set are declared
            const allCardsPresent = expectedSet.every(expected =>
                declaration.some(decl => decl.card.suit === expected.suit && decl.card.rank === expected.rank)
            );

            if (!allCardsPresent) {
                socket.emit('error', { message: 'Declaration is missing cards from the set' });
                return;
            }

            // Verify each declared card-player mapping is correct
            const isCorrect = declaration.every(decl => {
                const targetPlayer = game.players.find(p => p.playerId === decl.playerId);
                if (!targetPlayer) return false;
                return targetPlayer.hand.some(c => c.suit === decl.card.suit && c.rank === decl.card.rank);
            });

            // Check if opponent held any card (for scoring on wrong declaration)
            const opponentHeldCard = !isCorrect && expectedSet.some(card => {
                const holder = game.players.find(p => p.hand.some(c => c.suit === card.suit && c.rank === card.rank));
                return holder && holder.team !== player.team;
            });

            // Remove all cards of this set from all players
            game.players.forEach(p => {
                p.hand = p.hand.filter(c => getSetName(c) !== setName);
            });

            // Update score and completed sets
            if (isCorrect) {
                game.gameData.teams[player.team!].score += 1;
                game.gameData.completedSets.push({ setName, completedBy: player.team! });
                game.gameData.log.push(`${player.name} declared ${setName} correctly!`);
            } else {
                const opponentTeam = player.team === 'A' ? 'B' : 'A';

                if (opponentHeldCard) {
                    game.gameData.teams[opponentTeam].score += 1;
                    game.gameData.completedSets.push({ setName, completedBy: opponentTeam });
                    game.gameData.log.push(`${player.name} declared ${setName} incorrectly. Opponent gets point.`);
                } else {
                    game.gameData.completedSets.push({ setName, completedBy: 'Discarded' });
                    game.gameData.log.push(`${player.name} declared ${setName} incorrectly. No point awarded.`);
                }

            }

            // If current turn holder lost all cards due to this declaration, they must pass
            const currentPlayer = game.players[game.gameData.turnIndex];
            if (currentPlayer && currentPlayer.hand.length === 0) {
                game.gameData.turnState = 'PASSING_TURN';
            }

            // Check for game over (all 9 sets completed)
            if (game.gameData.completedSets.length === 9) {
                game.status = 'GAME_OVER';
                const { A, B } = game.gameData.teams;
                game.gameData.winner = A.score > B.score ? 'A' : B.score > A.score ? 'B' : 'DRAW';
            }

            emitGameState(game, io);
        });


        // Pass turn to teammate (when player has no cards left)
        socket.on('pass_turn', ({ roomId, targetId }: { roomId: string, targetId: string }) => {
            const game = rooms.get(roomId);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            // Find player and validate turn
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex === -1) {
                socket.emit('error', { message: 'You are not in this game' });
                return;
            }

            if (game.gameData.turnIndex !== playerIndex) {
                socket.emit('error', { message: "It's not your turn" });
                return;
            }

            const player = game.players[playerIndex];

            if (player.hand.length > 0) {
                socket.emit('error', { message: 'You still have cards' });
                return;
            }

            // Validate target (use playerId for stable identification after reconnects)
            const targetIndex = game.players.findIndex(p => p.playerId === targetId);
            if (targetIndex === -1) {
                socket.emit('error', { message: 'Target player not found' });
                return;
            }

            const target = game.players[targetIndex];

            if (target.team !== player.team) {
                socket.emit('error', { message: 'Must pass to a teammate' });
                return;
            }

            if (target.hand.length === 0) {
                socket.emit('error', { message: 'Cannot pass to teammate with no cards' });
                return;
            }

            // Pass turn
            game.gameData.turnIndex = targetIndex;
            game.gameData.turnState = 'NORMAL';
            game.gameData.log.push(`${player.name} passed turn to ${target.name}`);

            emitGameState(game, io);
        });


        // Player leaves the room
        socket.on('leave_room', ({ roomId }: { roomId: string }) => {
            const game = rooms.get(roomId);
            if (!game) {
                socket.emit('error', { message: 'Room not found' });
                return;
            }

            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex === -1) {
                socket.emit('error', { message: 'You are not in this room' });
                return;
            }

            const player = game.players[playerIndex];
            game.players.splice(playerIndex, 1);
            socket.leave(roomId);

            // If room is empty, delete it
            if (game.players.length === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted (no players left)`);
                return;
            }

            // If leaving player was owner, assign new owner
            if (player.isOwner) {
                game.players[0].isOwner = true;
            }

            io.to(roomId).emit('player_update', game.players);
            console.log(`${player.name} left room ${roomId}`);
        });

        
        // Handle player disconnect (cannot receive data - connection is closed)
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
            
            // Find which room this socket was in
            for (const [roomId, game] of rooms) {
                const player = game.players.find(p => p.id === socket.id);
                if (!player) continue;

                // If this is the last player in the room, delete the room
                if (game.players.length === 1) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (last player disconnected)`);
                    break;
                }

                // Don't remove player - they might reconnect with same playerId
                const status = game.status === 'LOBBY' ? 'lobby' : 'game';
                console.log(`${player.name} disconnected from ${status} in room ${roomId}`);
                
                // Notify other players about the disconnect
                io.to(roomId).emit('player_disconnected', { 
                    playerId: player.playerId,
                    playerName: player.name 
                });
                
                break; // Player can only be in one room
            }
        });
    });
};

// Helper to emit game state to all players securely
const emitGameState = (game: GameState, io: Server) => {
    game.players.forEach(player => {
        io.to(player.id).emit('game_update', {
            hand: player.hand,
            turnIndex: game.gameData.turnIndex,
            players: game.players.map(p => ({
                id: p.id,
                playerId: p.playerId,
                name: p.name,
                team: p.team,
                isOwner: p.isOwner,
                cardCount: p.hand.length
            })),
            lastAsk: game.gameData.lastAsk,
            myTeam: player.team,
            scores: {
                A: game.gameData.teams.A.score,
                B: game.gameData.teams.B.score
            },
            completedSets: game.gameData.completedSets,
            turnState: game.gameData.turnState,
            winner: game.gameData.winner
        });
    });
};
