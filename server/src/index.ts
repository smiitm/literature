import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { GameState, Player } from './types';

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
            settings: { maxPlayers: 6 } // Default
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

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Handle player removal if in lobby
        rooms.forEach((game, roomId) => {
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                game.players.splice(playerIndex, 1);
                if (game.players.length === 0) {
                    rooms.delete(roomId);
                } else {
                    io.to(roomId).emit('player_update', game.players);
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
