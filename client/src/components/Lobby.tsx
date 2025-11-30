import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { ModeToggle } from './mode-toggle';

interface Player {
    id: string;
    name: string;
    isOwner: boolean;
}

interface LobbyProps {
    roomId: string;
    players: Player[];
}

export function Lobby({ roomId, players }: LobbyProps) {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    // Effect to clear error when room changes
    useEffect(() => {
        setError('');
    }, [roomId]);

    useEffect(() => {
        socket.on('error', ({ message }) => {
            setError(message);
        });

        return () => {
            socket.off('error');
        };
    }, []);

    const createGame = () => {
        if (!playerName) return setError('Name is required');
        socket.emit('create_game', { playerName });
    };

    const joinGame = () => {
        if (!playerName) return setError('Name is required');
        if (!roomCode) return setError('Room Code is required');
        socket.emit('join_game', { roomCode, playerName });
    };

    if (roomId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative">
                <div className="absolute top-4 right-4">
                    <ModeToggle />
                </div>
                <h1 className="text-4xl font-bold mb-8">Lobby: {roomId}</h1>
                <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-lg border">
                    <h2 className="text-2xl font-semibold mb-4">Players</h2>
                    <ul className="space-y-2">
                        {players.map((p) => (
                            <li key={p.id} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{p.name} {p.id === socket.id && '(You)'}</span>
                                {p.isOwner && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Owner</span>}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {players.find(p => p.id === socket.id)?.isOwner ? (
                            <button
                                onClick={() => socket.emit('start_game')}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded font-medium"
                            >
                                Start Game
                            </button>
                        ) : (
                            'Waiting for owner to start game...'
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative">
            <div className="absolute top-4 right-4">
                <ModeToggle />
            </div>
            <h1 className="text-5xl font-bold mb-12">Literature</h1>

            <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-xl border space-y-6">
                {error && (
                    <div className="p-3 bg-destructive/10 text-destructive rounded text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Your Name</label>
                    <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter your name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={createGame}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                    >
                        Create Game
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Or join existing</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Room Code"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                        />
                        <button
                            onClick={joinGame}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2"
                        >
                            Join
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
