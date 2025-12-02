import { ModeToggle } from './mode-toggle';
import { getTeamColor, getSuitIcon, type Card } from '@/lib/gameUtils';

interface LastAsk {
    askerName: string;
    targetName: string;
    card: Card;
    success: boolean;
}

interface GameHeaderProps {
    lastAsk: LastAsk | null;
    scores: { A: number, B: number };
}

export function GameHeader({ lastAsk, scores }: GameHeaderProps) {
    return (
        <div className="p-4 border-b bg-card flex items-center justify-between">
            <h1 className="text-2xl font-bold">Literature</h1>

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
