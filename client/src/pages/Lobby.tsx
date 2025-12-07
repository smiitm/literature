import { socket } from '../socket';
import { disconnectSocket, getPlayerId } from '../lib/socketManager';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types';

interface LobbyProps {
    roomId: string;
    players: Player[];
}

export function Lobby({ roomId, players }: LobbyProps) {
    const currentPlayer = players.find(p => p.playerId === getPlayerId());
    const isOwner = currentPlayer?.isOwner ?? false;

    const handleLeaveRoom = () => {
        disconnectSocket();
        window.location.reload();
    };

    const handleStartGame = () => {
        socket.emit('start_game', { roomId, playerId: getPlayerId() });
    };

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
                            {p.isOwner && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                                    Owner
                                </span>
                            )}
                        </li>
                    ))}
                </ul>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    {isOwner ? (
                        <Button onClick={handleStartGame}>
                            Start Game
                        </Button>
                    ) : (
                        'Waiting for owner to start game...'
                    )}
                </div>

                <div className="mt-4 text-center">
                    <Button variant="outline" onClick={handleLeaveRoom}>
                        Leave Room
                    </Button>
                </div>
            </div>
        </div>
    );
}
