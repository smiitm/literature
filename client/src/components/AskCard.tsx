import { useState } from 'react';
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

interface ActionPanelProps {
    isMyTurn: boolean;
    turnIndex: number;
    players: Player[];
    turnState: 'NORMAL' | 'PASSING_TURN';
    myTeam: 'A' | 'B' | null;
    socketId: string;
    roomId: string;
}

export function ActionPanel({ isMyTurn, turnIndex, players, turnState, myTeam, socketId, roomId }: ActionPanelProps) {
    const [passTarget, setPassTarget] = useState<string>('');

    // Ask Card State
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [askRank, setAskRank] = useState<string>('');
    const [askSuit, setAskSuit] = useState<string>('');

    const opponents = players.filter(p => p.id !== socketId && p.team !== myTeam && (p.cardCount ?? 0) > 0);

    const handleAsk = () => {
        if (!selectedOpponent || !askRank || !askSuit) return;
        socket.emit('ask_card', {
            roomId,
            targetId: selectedOpponent,
            card: { rank: askRank, suit: askSuit }
        });
        setAskRank('');
        setAskSuit('');
    };

    const handlePassTurn = () => {
        if (!passTarget) return;
        socket.emit('pass_turn', { roomId, targetId: passTarget });
        setPassTarget('');
    };

    return (
        <div className="w-96 border-l bg-card p-6 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
                {isMyTurn ? 'Your Turn' : `Waiting for ${players[turnIndex]?.name}`}
            </h2>

            {isMyTurn && turnState === 'PASSING_TURN' ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">You have no cards. Pass your turn to a teammate.</p>
                    <Select value={passTarget} onValueChange={setPassTarget}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Teammate..." />
                        </SelectTrigger>
                        <SelectContent>
                            {players.filter(p => p.team === myTeam && p.id !== socketId && (p.cardCount ?? 0) > 0).map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
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
                        <h3 className="font-semibold">Ask for Card</h3>

                        <div>
                            <label className="text-xs text-muted-foreground">Opponent</label>
                            <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {opponents.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-muted-foreground">Rank</label>
                                <Select value={askRank} onValueChange={setAskRank}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ranks.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground">Suit</label>
                                <Select value={askSuit} onValueChange={setAskSuit}>
                                    <SelectTrigger className="text-sm">
                                        <SelectValue placeholder="Select..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suits.map(s => <SelectItem key={s} value={s}>{getSuitIcon(s)} {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button
                            className="w-full text-sm"
                            onClick={handleAsk}
                            disabled={!selectedOpponent || !askRank || !askSuit}
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
