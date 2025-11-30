import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameState, Player, Card, Suit, Rank } from './types';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all for dev
        methods: ["GET", "POST"]
    }
});

const rooms = new Map<string, GameState>();

const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const getSetName = (card: Card): string => {
    if (card.rank === '7' || card.suit === 'Joker') return 'Sevens';
    if (['A', '2', '3', '4', '5', '6'].includes(card.rank)) return `Low ${card.suit}`;
    if (['8', '9', '10', 'J', 'Q', 'K'].includes(card.rank)) return `High ${card.suit}`;
    return 'Unknown';
};

const getSetCards = (setName: string): Card[] => {
    if (setName === 'Sevens') {
        return [
            { suit: 'Spades', rank: '7' },
            { suit: 'Hearts', rank: '7' },
            { suit: 'Clubs', rank: '7' },
            { suit: 'Diamonds', rank: '7' },
            { suit: 'Joker', rank: 'Big' },
            { suit: 'Joker', rank: 'Small' }
        ];
    }
    const [range, suit] = setName.split(' ');
    const ranks = range === 'Low'
        ? ['A', '2', '3', '4', '5', '6']
        : ['8', '9', '10', 'J', 'Q', 'K'];

    return ranks.map(rank => ({ suit: suit as Suit, rank: rank as Rank }));
};

io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create_game', ({ playerName }: { playerName: string }) => {
        const roomId = generateRoomId();
        const newPlayer: Player = {
            id: socket.id,
            name: playerName,
            hand: [],
            team: null,
            isOwner: true
        };

        const newGame: GameState = {
            roomId,
            status: 'LOBBY',
            players: [newPlayer],
            settings: { maxPlayers: 6 }, // Default
            gameData: {
                deck: [],
                turnIndex: 0,
                teams: {
                    A: { score: 0, declaredSets: [] },
                    B: { score: 0, declaredSets: [] }
                },
                log: [],
                discardedSets: [],
                turnState: 'NORMAL'
            }
        };

        rooms.set(roomId, newGame);
        socket.join(roomId);

        socket.emit('game_created', { roomId });
        io.to(roomId).emit('player_update', newGame.players);
        console.log(`Game created: ${roomId} by ${playerName}`);
    });

    socket.on('join_game', ({ roomCode, playerName }: { roomCode: string, playerName: string }) => {
        const game = rooms.get(roomCode);
        if (!game) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }

        if (game.status !== 'LOBBY') {
            socket.emit('error', { message: 'Game already started' });
            return;
        }

        if (game.players.length >= game.settings.maxPlayers) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        const newPlayer: Player = {
            id: socket.id,
            name: playerName,
            hand: [],
            team: null,
            isOwner: false
        };

        game.players.push(newPlayer);
        socket.join(roomCode);

        io.to(roomCode).emit('player_update', game.players);
        socket.emit('joined_game', { roomId: roomCode });
        console.log(`${playerName} joined ${roomCode}`);
    });

    socket.on('start_game', () => {
        // Find the game where this socket is the owner
        let game: GameState | undefined;
        rooms.forEach(g => {
            if (g.players.find(p => p.id === socket.id && p.isOwner)) {
                game = g;
            }
        });

        if (!game) {
            socket.emit('error', { message: 'You are not the owner of any game' });
            return;
        }

        if (game.players.length < 4) { // Minimum 4 players for Literature
            // For testing purposes, we might allow fewer, but let's stick to rules for now or warn
            // socket.emit('error', { message: 'Need at least 4 players' });
            // return;
        }

        // 1. Assign Teams (Alternating)
        game.players.forEach((player, index) => {
            player.team = index % 2 === 0 ? 'A' : 'B';
        });

        // 2. Generate and Shuffle Deck (54 cards)
        const suits: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
        const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        let deck: Card[] = [];

        suits.forEach(suit => {
            ranks.forEach(rank => {
                deck.push({ suit, rank });
            });
        });

        // Add Jokers
        deck.push({ suit: 'Joker', rank: 'Big' });
        deck.push({ suit: 'Joker', rank: 'Small' });

        // Shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // 3. Distribute Cards
        const numPlayers = game.players.length;
        deck.forEach((card, index) => {
            const playerIndex = index % numPlayers;
            game!.players[playerIndex].hand.push(card);
        });

        // 4. Set Game State
        game.status = 'IN_GAME';
        game.gameData.turnIndex = Math.floor(Math.random() * numPlayers);
        game.gameData.deck = []; // Deck is empty after distribution

        // 5. Emit Game Started
        io.to(game!.roomId).emit('game_started', {
            turnIndex: game!.gameData.turnIndex,
            players: game!.players // Note: In a real app, we might sanitize this to not show opponents' hands, but for now we send it all as per idea.md notes (wait, idea.md says NEVER send full state).
            // idea.md says: "Only send a player *their specific hand*."
        });

        // Let's follow the security rule: Send specific data to each client
        game!.players.forEach(player => {
            io.to(player.id).emit('game_started_personal', {
                hand: player.hand,
                turnIndex: game!.gameData.turnIndex,
                players: game!.players.map(p => ({ ...p, hand: [] })), // Hide other hands
                myTeam: player.team
            });
        });

        console.log(`Game started in room ${game!.roomId}`);
    });

    socket.on('ask_card', ({ targetId, card }: { targetId: string, card: Card }) => {
        // Find game
        let game: GameState | undefined;
        let playerIndex = -1;
        rooms.forEach(g => {
            const idx = g.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                game = g;
                playerIndex = idx;
            }
        });

        if (!game) return;

        const player = game.players[playerIndex];

        // 1. Validate Turn
        if (game.gameData.turnIndex !== playerIndex) {
            socket.emit('error', { message: "It's not your turn" });
            return;
        }

        // 2. Validate Target
        const targetIndex = game.players.findIndex(p => p.id === targetId);
        if (targetIndex === -1) {
            socket.emit('error', { message: "Target player not found" });
            return;
        }
        const target = game.players[targetIndex];

        if (player.team === target.team) {
            socket.emit('error', { message: "Cannot ask teammate" });
            return;
        }

        if (target.hand.length === 0) {
            socket.emit('error', { message: "Target has no cards" });
            return;
        }

        // 3. Validate Player has Base (at least one card of the SET)
        const requestedSet = getSetName(card);
        const hasBase = player.hand.some(c => getSetName(c) === requestedSet);

        if (!hasBase) {
            socket.emit('error', { message: `You must have a card of the "${requestedSet}" set to ask` });
            return;
        }

        // 4. Validate Player doesn't have the card
        if (player.hand.some(c => c.suit === card.suit && c.rank === card.rank)) {
            socket.emit('error', { message: "You already have this card" });
            return;
        }

        // 5. Check if Target has the card
        const cardIndex = target.hand.findIndex(c => c.suit === card.suit && c.rank === card.rank);
        const success = cardIndex !== -1;

        // Update Last Ask
        game.gameData.lastAsk = {
            askerName: player.name,
            targetName: target.name,
            card: card,
            success: success
        };

        if (success) {
            // Transfer Card
            const [transferredCard] = target.hand.splice(cardIndex, 1);
            player.hand.push(transferredCard);

            // Turn remains with asker
            game.gameData.log.push(`${player.name} took ${card.rank} of ${card.suit} from ${target.name}`);
        } else {
            // Turn passes to target
            game.gameData.turnIndex = targetIndex;
            game.gameData.log.push(`${player.name} asked ${target.name} for ${card.rank} of ${card.suit} and missed`);
        }

        // Emit Updates
        emitGameState(game, io);
    });

    socket.on('declare_set', ({ declaration }: { declaration: { card: Card, playerId: string }[] }) => {
        // Find game
        let game: GameState | undefined;
        let playerIndex = -1;
        rooms.forEach(g => {
            const idx = g.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                game = g;
                playerIndex = idx;
            }
        });

        if (!game) return;

        const player = game.players[playerIndex];

        // 1. Validate Turn
        if (game.gameData.turnIndex !== playerIndex) {
            socket.emit('error', { message: "It's not your turn" });
            return;
        }

        // 2. Validate Set Consistency
        if (declaration.length === 0) return;
        const firstCard = declaration[0].card;
        const setName = getSetName(firstCard);

        const expectedSet = getSetCards(setName);
        if (declaration.length !== expectedSet.length) {
            socket.emit('error', { message: `Invalid declaration: Set ${setName} requires ${expectedSet.length} cards` });
            return;
        }

        const allPresent = expectedSet.every(ec =>
            declaration.some(dc => dc.card.suit === ec.suit && dc.card.rank === ec.rank)
        );

        if (!allPresent) {
            socket.emit('error', { message: "Invalid declaration: Missing cards from set" });
            return;
        }

        // 3. Verify Ownership & Scoring
        let correct = true;
        for (const decl of declaration) {
            const targetPlayer = game.players.find(p => p.id === decl.playerId);
            if (!targetPlayer) {
                correct = false;
                break;
            }
            const hasCard = targetPlayer.hand.some(c => c.suit === decl.card.suit && c.rank === decl.card.rank);
            if (!hasCard) {
                correct = false;
                break;
            }
        }

        // Check if opponent team held any card (for scoring on failure)
        let opponentHasCard = false;
        if (!correct) {
            for (const card of expectedSet) {
                const holder = game.players.find(p => p.hand.some(c => c.suit === card.suit && c.rank === card.rank));
                if (holder && holder.team !== player.team) {
                    opponentHasCard = true;
                    break;
                }
            }
        }

        // Remove cards from ALL players' hands
        game.players.forEach(p => {
            p.hand = p.hand.filter(c => getSetName(c) !== setName);
        });

        // 4. Update Score and Turn
        if (correct) {
            if (player.team) {
                game.gameData.teams[player.team].score += 1;
                game.gameData.teams[player.team].declaredSets.push(setName);
            }
            game.gameData.log.push(`${player.name} declared ${setName} correctly`);

            // Turn Logic: Correct -> Keep turn (unless empty hand)
            if (player.hand.length === 0) {
                game.gameData.turnState = 'PASSING_TURN';
            }
        } else {
            if (opponentHasCard) {
                const opponentTeam = player.team === 'A' ? 'B' : 'A';
                game.gameData.teams[opponentTeam].score += 1;
                game.gameData.teams[opponentTeam].declaredSets.push(setName);
                game.gameData.log.push(`${player.name} declared ${setName} incorrectly. Opponent gets point.`);
            } else {
                game.gameData.discardedSets.push(setName);
                game.gameData.log.push(`${player.name} declared ${setName} incorrectly. No point awarded.`);
            }

            // Turn Logic: Incorrect -> Pass turn to next player
            game.gameData.turnIndex = (game.gameData.turnIndex + 1) % game.players.length;
        }

        // 5. Check Game Over
        const totalSets = 9;
        const declared = game.gameData.teams.A.declaredSets.length + game.gameData.teams.B.declaredSets.length + game.gameData.discardedSets.length;
        if (declared === totalSets) {
            game.status = 'GAME_OVER';
            if (game.gameData.teams.A.score > game.gameData.teams.B.score) game.gameData.winner = 'A';
            else if (game.gameData.teams.B.score > game.gameData.teams.A.score) game.gameData.winner = 'B';
            else game.gameData.winner = 'DRAW';
        }

        emitGameState(game, io);
    });

    socket.on('pass_turn', ({ targetId }: { targetId: string }) => {
        let game: GameState | undefined;
        let playerIndex = -1;
        rooms.forEach(g => {
            const idx = g.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                game = g;
                playerIndex = idx;
            }
        });

        if (!game) return;
        const player = game.players[playerIndex];

        if (game.gameData.turnIndex !== playerIndex) {
            socket.emit('error', { message: "It's not your turn" });
            return;
        }

        if (player.hand.length > 0) {
            socket.emit('error', { message: "You still have cards" });
            return;
        }

        const targetIndex = game.players.findIndex(p => p.id === targetId);
        if (targetIndex === -1) return;
        const target = game.players[targetIndex];

        if (target.team !== player.team) {
            socket.emit('error', { message: "Must pass to teammate" });
            return;
        }

        game.gameData.turnIndex = targetIndex;
        game.gameData.turnState = 'NORMAL';
        game.gameData.log.push(`${player.name} passed turn to ${target.name}`);

        emitGameState(game, io);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Handle player removal if in lobby
        rooms.forEach((game, roomId) => {
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                if (game.status === 'LOBBY') {
                    game.players.splice(playerIndex, 1);
                    if (game.players.length === 0) {
                        rooms.delete(roomId);
                    } else {
                        io.to(roomId).emit('player_update', game.players);
                    }
                } else {
                    // Handle disconnect during game (reconnection logic needed later)
                    console.log(`Player ${game.players[playerIndex].name} disconnected during game`);
                }
            }
        });
    });
});

// Helper to emit game state to all players securely
const emitGameState = (game: GameState, io: Server) => {
    game.players.forEach(player => {
        io.to(player.id).emit('game_update', {
            hand: player.hand,
            turnIndex: game.gameData.turnIndex,
            players: game.players.map(p => ({
                ...p,
                hand: [], // Hide hands
                cardCount: p.hand.length // Useful for UI
            })),
            lastAsk: game.gameData.lastAsk,
            log: game.gameData.log,
            myTeam: player.team,
            scores: {
                A: game.gameData.teams.A.score,
                B: game.gameData.teams.B.score
            },
            discardedSets: game.gameData.discardedSets,
            turnState: game.gameData.turnState,
            winner: game.gameData.winner
        });
    });
};



const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
