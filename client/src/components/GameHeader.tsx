import { ModeToggle } from './mode-toggle';
import { Button } from '@/components/ui/button';
import { disconnectSocket } from '@/lib/socketManager';
import { getTeamColor, getSuitIcon } from '@/lib/gameUtils';
import type { LastAsk } from '@/types';

interface GameHeaderProps {
    lastAsk: LastAsk | null;
    scores: { A: number, B: number };
}

export function GameHeader({ lastAsk, scores }: GameHeaderProps) {
    const handleLeaveRoom = () => {
        disconnectSocket();
        window.location.reload();
    };

    return (
        <div className="p-4 border-b bg-card flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold">Literature</h1>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLeaveRoom}
                >
                    Leave
                </Button>
            </div>

            {/* Last Transaction */}
            <div className="flex-1 text-center">
                {lastAsk && (
                    <div className="text-sm">
                        <span className="font-semibold">{lastAsk.askerName}</span> asked{' '}
                        <span className="font-semibold">{lastAsk.targetName}</span> for{' '}
                        <span className="font-semibold">{lastAsk.card.rank} {getSuitIcon(lastAsk.card.suit)}</span>
                        <span className={`ml-2 font-bold ${lastAsk.success ? 'text-green-500' : 'text-red-500'}`}>
                            {lastAsk.success ? '✓' : '✗'}
                        </span>
                    </div>
                )}
            </div>

            {/* Scores & Toggle */}
            <div className="flex items-center gap-2">
                <div className="px-2 py-1 rounded font-bold text-white" style={{ backgroundColor: getTeamColor('A') }}>
                    {scores.A}
                </div>
                <div className="px-2 py-1 rounded font-bold text-white" style={{ backgroundColor: getTeamColor('B') }}>
                    {scores.B}
                </div>
                <ModeToggle />
            </div>
        </div>
    );
}
