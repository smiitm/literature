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
import { getSuitIcon, getSuitColor, getSetCards, ranks, suits } from '@/lib/gameUtils';

interface Player {
    id: string;
    name: string;
    team: 'A' | 'B' | null;
    cardCount?: number;
}

interface ActionPanelProps {
    isMyTurn: boolean;
    turnIndex: number;
    players: Player[];
    turnState: 'NORMAL' | 'PASSING_TURN';
    myTeam: 'A' | 'B' | null;
    socketId: string;
}

export function ActionPanel({ isMyTurn, turnIndex, players, turnState, myTeam, socketId }: ActionPanelProps) {
    const [passTarget, setPassTarget] = useState<string>('');

    // Ask Card State
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [askRank, setAskRank] = useState<string>('');
    const [askSuit, setAskSuit] = useState<string>('');

    // Declare Set State
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [declareSet, setDeclareSet] = useState<string>('');
    const [declarationMap, setDeclarationMap] = useState<{ [key: string]: string }>({});

    const opponents = players.filter(p => p.id !== socketId && p.team !== myTeam && (p.cardCount ?? 0) > 0);

    const handleAsk = () => {
        if (!selectedOpponent || !askRank || !askSuit) return;
        socket.emit('ask_card', {
            targetId: selectedOpponent,
            card: { rank: askRank, suit: askSuit }
        });
        setAskRank('');
        setAskSuit('');
    };

    const handleDeclare = () => {
        const cards = getSetCards(declareSet);
        const declaration = cards.map(c => ({
            card: c,
            playerId: declarationMap[`${c.rank}-${c.suit}`]
        }));

        if (declaration.some(d => !d.playerId)) {
            alert("Please assign all cards to players.");
            return;
        }

        socket.emit('declare_set', { declaration });
        setIsDeclaring(false);
        setDeclareSet('');
        setDeclarationMap({});
    };

    const handlePassTurn = () => {
        if (!passTarget) return;
        socket.emit('pass_turn', { targetId: passTarget });
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
                            {players.filter(p => p.team === myTeam && p.id !== socketId).map(p => (
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

                    <div className="border-t pt-4">
                        <Button
                            variant="destructive"
                            className="w-full text-sm"
                            onClick={() => setIsDeclaring(!isDeclaring)}
                        >
                            {isDeclaring ? 'Cancel' : 'Declare Set'}
                        </Button>
                    </div>

                    {/* Declaration Form */}
                    {isDeclaring && (
                        <div className="space-y-3 border-t pt-4">
                            <Select value={declareSet} onValueChange={setDeclareSet}>
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Select Set..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low Spades">Low Spades (A-6)</SelectItem>
                                    <SelectItem value="High Spades">High Spades (8-K)</SelectItem>
                                    <SelectItem value="Low Hearts">Low Hearts (A-6)</SelectItem>
                                    <SelectItem value="High Hearts">High Hearts (8-K)</SelectItem>
                                    <SelectItem value="Low Clubs">Low Clubs (A-6)</SelectItem>
                                    <SelectItem value="High Clubs">High Clubs (8-K)</SelectItem>
                                    <SelectItem value="Low Diamonds">Low Diamonds (A-6)</SelectItem>
                                    <SelectItem value="High Diamonds">High Diamonds (8-K)</SelectItem>
                                    <SelectItem value="Sevens">Sevens (7s + Jokers)</SelectItem>
                                </SelectContent>
                            </Select>

                            {declareSet && (
                                <>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {getSetCards(declareSet).map((card) => (
                                            <div key={`${card.rank}-${card.suit}`} className="flex items-center justify-between text-sm p-2 border rounded">
                                                <span className={getSuitColor(card.suit)}>
                                                    {card.rank} {getSuitIcon(card.suit)}
                                                </span>
                                                <Select
                                                    value={declarationMap[`${card.rank}-${card.suit}`] || ''}
                                                    onValueChange={(value: string) => setDeclarationMap(prev => ({
                                                        ...prev,
                                                        [`${card.rank}-${card.suit}`]: value
                                                    }))}
                                                >
                                                    <SelectTrigger className="text-xs w-32 h-8">
                                                        <SelectValue placeholder="Holder..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {players.filter(p => p.team === myTeam).map(p => (
                                                            <SelectItem key={p.id} value={p.id}>{p.name} {p.id === socketId ? '(You)' : ''}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-sm"
                                        onClick={handleDeclare}
                                        disabled={!declareSet || getSetCards(declareSet).some(c => !declarationMap[`${c.rank}-${c.suit}`])}
                                    >
                                        Submit Declaration
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Wait for your turn to take action.</p>
            )}
        </div>
    );
}
