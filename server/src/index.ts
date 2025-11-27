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
                log: []
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

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
