import { ModeToggle } from './ui/mode-toggle';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { disconnectSocket } from '@/lib/socketManager';
import { getTeamColor, getSuitIcon } from '@/lib/gameUtils';
import { DeclareSet } from './DeclareSet';
import type { LastAsk, Player, CompletedSet } from '@/types';

interface GameHeaderProps {
    lastAsk: LastAsk | null;
    scores: { A: number, B: number };
    completedSets: CompletedSet[];
    players: Player[];
    myTeam: 'A' | 'B' | null;
    socketId: string;
    roomId: string;
}

export function GameHeader({ lastAsk, scores, completedSets, players, myTeam, socketId, roomId }: GameHeaderProps) {
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
                <DeclareSet
                    players={players}
                    myTeam={myTeam}
                    socketId={socketId}
                    roomId={roomId}
                />
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
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm border-b pb-2">Completed Sets</h4>
                            {completedSets.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sets completed yet</p>
                            ) : (
                                <div className="space-y-1">
                                    {completedSets.map((set, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span>{set.setName}</span>
                                            {set.completedBy === 'Discarded' ? (
                                                <span className="text-xs text-muted-foreground">Discarded</span>
                                            ) : (
                                                <span
                                                    className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                                    style={{ backgroundColor: getTeamColor(set.completedBy) }}
                                                >
                                                    Team {set.completedBy}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
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
