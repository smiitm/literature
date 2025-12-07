import { useState } from 'react';
import { socket } from '../socket';
import { connectSocket, getPlayerId } from '../lib/socketManager';
import { toast } from '@/components/ui/sonner';
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
import { WordRotate } from "@/components/ui/WordRotate"

export function Home() {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const handleCreateRoom = async () => {
        if (!playerName.trim()) {
            toast.error('Name is required');
            return;
        }

        try {
            await connectSocket();
            const playerId = getPlayerId();
            socket.emit('create_game', { playerName: playerName.trim(), playerId });
        } catch {
            toast.error('Failed to connect to server');
        }
    };

    const handleJoinRoom = async () => {
        if (!playerName.trim()) {
            toast.error('Name is required');
            return;
        }
        if (!roomCode.trim()) {
            toast.error('Room Code is required');
            return;
        }

        try {
            await connectSocket();
            const playerId = getPlayerId();
            socket.emit('join_game', { roomCode: roomCode.trim(), playerName: playerName.trim(), playerId });
        } catch {
            toast.error('Failed to connect to server');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground relative">
            <h1 className="text-8xl font-bold tracking-tight">Literature</h1>
            <WordRotate className="text-3xl mb-6 text-muted-foreground" words={["probability to 50/50 hi hai", "Mere patte dekh liye isne"]} />
 
            <div className="flex gap-6">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            size="lg"
                            className="text-lg font-semibold h-10 px-4"
                        >
                            Create Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Room</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-name p-4">Your Name</Label>
                                <Input
                                    id="create-name"
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <Button className="w-fit" onClick={handleCreateRoom}>Create</Button>
                    </DialogContent>
                </Dialog>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            size="lg"
                            className="text-lg font-semibold h-10 px-6"
                        >
                            Join Room
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Join Room</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                        </div>
                        <Button onClick={handleJoinRoom}>Join</Button>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
