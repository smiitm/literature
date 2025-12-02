import { getTeamColor } from '@/lib/gameUtils';

interface Player {
    id: string;
    name: string;
    team: 'A' | 'B' | null;
    cardCount?: number;
}

interface PlayerGridProps {
    players: Player[];
    turnIndex: number;
    socketId: string;
}

export function PlayerGrid({ players, turnIndex, socketId }: PlayerGridProps) {
    return (
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
            <div className="grid grid-cols-3 gap-6 max-w-3xl">
                {players.filter(p => p.id !== socketId).map((player) => (
                    <div
                        key={player.id}
                        className={`
                            relative p-6 rounded-lg border-2 transition-all text-white
                            ${players[turnIndex]?.id === player.id ? 'ring-4 ring-white/50' : ''}
                        `}
                        style={{ backgroundColor: getTeamColor(player.team) }}
                    >
                        <div className="text-center">
                            <div className="text-lg font-bold">{player.name}</div>
                            <div className="mt-2 text-3xl font-semibold">{player.cardCount ?? 0}</div>
                            <div className="text-xs opacity-90">cards</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
