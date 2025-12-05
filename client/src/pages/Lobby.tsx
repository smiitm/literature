import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { connectSocket, saveSession, disconnectSocket, getPlayerId } from '../lib/socketManager';
import { toast } from '@/components/ui/sonner';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Player } from '@/types';

interface LobbyProps {
    roomId: string;
    players: Player[];
}

export function Lobby({ roomId, players }: LobbyProps) {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    // Save session when successfully joined/created room
    useEffect(() => {
        if (roomId && playerName) {
            saveSession(roomId, playerName);
        }
    }, [roomId, playerName]);

    const handleCreateRoom = async () => {
        if (!playerName) {
            toast.error('Name is required');
            return;
        }

        try {
            await connectSocket();
            const playerId = getPlayerId();
            socket.emit('create_game', { playerName, playerId });
            setShowCreateModal(false);
        } catch {
            toast.error('Failed to connect to server');
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName) {
            toast.error('Name is required');
            return;
        }
        if (!roomCode) {
            toast.error('Room Code is required');
            return;
        }

        try {
            await connectSocket();
            const playerId = getPlayerId();
            socket.emit('join_game', { roomCode, playerName, playerId });
            setShowJoinModal(false);
        } catch {
            toast.error('Failed to connect to server');
        }
    };

    const handleLeaveRoom = () => {
        disconnectSocket();
        window.location.reload();
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
                                <span>{p.name} {p.playerId === getPlayerId() && '(You)'}</span>
                                {p.isOwner && <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Owner</span>}
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        {players.find(p => p.playerId === getPlayerId())?.isOwner ? (
                            <Button
                                onClick={() => socket.emit('start_game', { roomId })}
                            >
                                Start Game
                            </Button>
                        ) : (
                            'Waiting for owner to start game...'
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <Button
                            variant="outline"
                            onClick={handleLeaveRoom}
                        >
                            Leave Room
                        </Button>
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

            {/* Very large title */}
            <h1 className="text-9xl font-bold tracking-tight">Literature</h1>

            {/* Subtitle */}
            <p className="text-3xl mb-16 text-muted-foreground">probability to 50/50 hi hai</p>

            {/* Two buttons side by side */}
            <div className="flex gap-6">
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogTrigger asChild>
                        <Button
                            size="lg"
                            className="text-lg font-semibold h-14 px-8 shadow-lg hover:scale-105 transition-transform"
                        >
                            Create Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Room</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-name">Your Name</Label>
                                <Input
                                    id="create-name"
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateRoom}
                                    className="flex-1"
                                >
                                    Create
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
                    <DialogTrigger asChild>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="text-lg font-semibold h-14 px-8 shadow-lg hover:scale-105 transition-transform"
                        >
                            Join Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Join Room</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="join-name">Your Name</Label>
                                <Input
                                    id="join-name"
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="room-code">Room Code</Label>
                                <Input
                                    id="room-code"
                                    placeholder="Enter room code"
                                    value={roomCode}
                                    onChange={(e) => setRoomCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowJoinModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleJoinRoom}
                                    className="flex-1"
                                >
                                    Join
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
