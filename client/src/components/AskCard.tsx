import { useMemo, useState } from 'react';
import { socket } from '../socket';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getSuitIcon, ranks, suits } from '@/lib/gameUtils';
import type { Player } from '@/types';

interface AskCardProps {
    isMyTurn: boolean;
    players: Player[];
    turnState: 'NORMAL' | 'PASSING_TURN';
    myTeam: 'A' | 'B' | null;
    playerId: string;
    roomId: string;
}

export function AskCard({ isMyTurn, players, turnState, myTeam, playerId, roomId }: AskCardProps) {
    const [passTarget, setPassTarget] = useState<string>('');

    // Ask Card State
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [askRank, setAskRank] = useState<string>('');
    const [askSuit, setAskSuit] = useState<string>('');

    // Memoize filtered lists to avoid recalculating on every render
    const opponents = useMemo(
        () => players.filter(p => p.playerId !== playerId && p.team !== myTeam && (p.cardCount ?? 0) > 0),
        [players, playerId, myTeam]
    );

    const teammates = useMemo(
        () => players.filter(p => p.team === myTeam && p.playerId !== playerId && (p.cardCount ?? 0) > 0),
        [players, playerId, myTeam]
    );

    const resetAskForm = () => {
        setAskRank('');
        setAskSuit('');
    };

    const handleAsk = () => {
        if (!selectedOpponent || !askRank || !askSuit) return;
        socket.emit('ask_card', {
            roomId,
            targetId: selectedOpponent,
            card: { rank: askRank, suit: askSuit }
        });
        resetAskForm();
    };

    const handlePassTurn = () => {
        if (!passTarget) return;
        socket.emit('pass_turn', { roomId, targetId: passTarget });
        setPassTarget('');
    };

    const isAskDisabled = !selectedOpponent || !askRank || !askSuit;

    return (
        <div className="w-96 border-l bg-card p-6 overflow-y-auto">

            {/* Pass Turn UI */}
            {isMyTurn && turnState === 'PASSING_TURN' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">You have no cards. Pass your turn to a teammate.</p>
                    <Select value={passTarget} onValueChange={setPassTarget}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Teammate..." />
                        </SelectTrigger>
                        <SelectContent>
                            {teammates.map(p => (
                                <SelectItem key={p.playerId} value={p.playerId}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        className="w-full"
                        onClick={handlePassTurn}
                        disabled={!passTarget}
                    >
                        Pass Turn
                    </Button>
                </div>
            ) : isMyTurn ? (
                <div className="space-y-6">
                    {/* Ask Card UI */}
                    <div className="space-y-3">
                        <h3 className="text-2xl font-semibold">Ask for Card</h3>

                        <div>
                            <label htmlFor="opponent-select" className="text-xs text-muted-foreground">Opponent</label>
                            <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                                <SelectTrigger id="opponent-select" className="text-sm">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {opponents.map(p => <SelectItem key={p.playerId} value={p.playerId}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground">Suit</label>
                                <div className="grid grid-cols-5 gap-1 mt-1">
                                    {suits.map(s => (
                                        <Button
                                            key={s}
                                            variant={askSuit === s ? 'default' : 'outline'}
                                            size="sm"
                                            className="text-sm px-2"
                                            onClick={() => {
                                                setAskSuit(s);
                                                // Reset rank when switching between Joker and regular suits
                                                if (s === 'Joker' && !['Red', 'Black'].includes(askRank)) {
                                                    setAskRank('');
                                                } else if (s !== 'Joker' && ['Red', 'Black'].includes(askRank)) {
                                                    setAskRank('');
                                                }
                                            }}
                                        >
                                            {getSuitIcon(s)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Rank</label>
                                {askSuit === 'Joker' ? (
                                    // Show only Red/Black for Joker
                                    <div className="flex gap-1 mt-1">
                                        <Button
                                            variant={askRank === 'Red' ? 'default' : 'outline'}
                                            size="sm"
                                            className="text-xs px-2 flex-1"
                                            onClick={() => setAskRank('Red')}
                                        >
                                            Red
                                        </Button>
                                        <Button
                                            variant={askRank === 'Black' ? 'default' : 'outline'}
                                            size="sm"
                                            className="text-xs px-2 flex-1"
                                            onClick={() => setAskRank('Black')}
                                        >
                                            Black
                                        </Button>
                                    </div>
                                ) : (
                                    // Show A-K for regular suits (exclude Red/Black)
                                    <div className="grid grid-cols-5 gap-1 mt-1">
                                        {ranks.filter(r => r !== 'Red' && r !== 'Black').map(r => (
                                            <Button
                                                key={r}
                                                variant={askRank === r ? 'default' : 'outline'}
                                                size="sm"
                                                className="text-xs px-2"
                                                onClick={() => setAskRank(r)}
                                            >
                                                {r}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            className="w-full text-sm"
                            onClick={handleAsk}
                            disabled={isAskDisabled}
                        >
                            Ask Card
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Wait for your turn to take action.</p>
            )}
        </div>
    );
}
