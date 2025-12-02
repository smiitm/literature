import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { ModeToggle } from './mode-toggle';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Card {
    suit: 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
    rank: string;
}

interface Player {
    id: string;
    name: string;
    team: 'A' | 'B' | null;
    isOwner: boolean;
    cardCount?: number;
}

interface LastAsk {
    askerName: string;
    targetName: string;
    card: Card;
    success: boolean;
}

interface GameProps {
    initialHand: Card[];
    initialTurnIndex: number;
    initialPlayers: Player[];
    myTeam: 'A' | 'B' | null;
}

export function Game({ initialHand, initialTurnIndex, initialPlayers, myTeam }: GameProps) {
    const [hand, setHand] = useState<Card[]>(initialHand);
    const [turnIndex, setTurnIndex] = useState(initialTurnIndex);
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [lastAsk, setLastAsk] = useState<LastAsk | null>(null);
    const [log, setLog] = useState<string[]>([]);
    const [turnState, setTurnState] = useState<'NORMAL' | 'PASSING_TURN'>('NORMAL');
    const [winner, setWinner] = useState<'A' | 'B' | 'DRAW' | undefined>(undefined);
    const [passTarget, setPassTarget] = useState<string>('');
    const [scores, setScores] = useState<{ A: number, B: number }>({ A: 0, B: 0 });

    // Ask Card State
    const [selectedOpponent, setSelectedOpponent] = useState<string>('');
    const [askRank, setAskRank] = useState<string>('');
    const [askSuit, setAskSuit] = useState<string>('');

    // Declare Set State
    const [isDeclaring, setIsDeclaring] = useState(false);
    const [declareSet, setDeclareSet] = useState<string>('');
    const [declarationMap, setDeclarationMap] = useState<{ [key: string]: string }>({});

    const sortedHand = [...hand].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.rank.localeCompare(b.rank);
    });

    const isMyTurn = players[turnIndex]?.id === socket.id;

    useEffect(() => {
        socket.on('game_update', (data) => {
            setHand(data.hand);
            setTurnIndex(data.turnIndex);
            setPlayers(data.players);
            if (data.lastAsk) setLastAsk(data.lastAsk);
            if (data.log) setLog(data.log);
            if (data.turnState) setTurnState(data.turnState);
            if (data.winner) setWinner(data.winner);
            if (data.scores) setScores(data.scores);
        });

        return () => {
            socket.off('game_update');
        };
    }, []);

    const getSetCards = (setName: string): Card[] => {
        if (setName === 'Sevens') {
            return [
                { suit: 'Spades', rank: '7' },
                { suit: 'Hearts', rank: '7' },
                { suit: 'Clubs', rank: '7' },
                { suit: 'Diamonds', rank: '7' },
                { suit: 'Joker', rank: 'Red' },
                { suit: 'Joker', rank: 'Black' }
            ];
        }
        if (!setName) return [];
        const [range, suit] = setName.split(' ');
        const ranks = range === 'Low'
            ? ['A', '2', '3', '4', '5', '6']
            : ['8', '9', '10', 'J', 'Q', 'K'];

        return ranks.map(rank => ({ suit: suit as any, rank }));
    };

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

    const getCardImage = (suit: string, rank: string) => {
        const suitLower = suit.toLowerCase();
        let rankLower = rank.toLowerCase();

        // Handle Jokers
        if (suit === 'Joker') {
            return rank === 'Red'
                ? new URL('../assets/cards/joker_red.svg', import.meta.url).href
                : new URL('../assets/cards/joker_black.svg', import.meta.url).href;
        }

        // Convert A to a for aces
        if (rank === 'A') rankLower = 'a';
        if (rank === 'J') rankLower = 'j';
        if (rank === 'Q') rankLower = 'q';
        if (rank === 'K') rankLower = 'k';

        return new URL(`../assets/cards/${suitLower}_${rankLower}.svg`, import.meta.url).href;
    };

    const getSuitIcon = (suit: string) => {
        switch (suit) {
            case 'Spades': return '♠️';
            case 'Hearts': return '♥️';
            case 'Clubs': return '♣️';
            case 'Diamonds': return '♦️';
            case 'Joker': return '🃏';
            default: return '';
        }
    };

    const getSuitColor = (suit: string) => {
        return ['Hearts', 'Diamonds'].includes(suit) ? 'text-red-500' : 'text-foreground';
    };

    const opponents = players.filter(p => p.id !== socket.id && p.team !== myTeam && (p.cardCount ?? 0) > 0);
    const suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds', 'Joker'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Red', 'Black'];

    const getTeamColor = (team: 'A' | 'B' | null) => {
        if (team === 'A') return '#3b82f6';
        if (team === 'B') return '#eab308';
        return '#888';
    };

    if (winner) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background text-foreground gap-8">
                <h1 className="text-6xl font-bold animate-bounce">
                    {winner === 'DRAW' ? 'It\'s a Draw!' : `Team ${winner} Wins!`}
                </h1>
                <div className="text-2xl">
                    Final Score - Team A: {scores.A} | Team B: {scores.B}
                </div>
                <Button
                    size="lg"
                    className="px-8 py-4 text-xl font-bold"
                    onClick={() => window.location.reload()}
                >
                    Back to Lobby
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Compact Header */}
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

            {/* Main Content: Players Grid (Left) + Action Panel (Right) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Players Grid */}
                <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
                    <div className="grid grid-cols-3 gap-6 max-w-3xl">
                        {players.filter(p => p.id !== socket.id).map((player) => (
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

                {/* Right: Action Panel */}
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
                                    {players.filter(p => p.team === myTeam && p.id !== socket.id).map(p => (
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
                                                                    <SelectItem key={p.id} value={p.id}>{p.name} {p.id === socket.id ? '(You)' : ''}</SelectItem>
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
            </div>

            {/* Bottom: Your Cards */}
            <div className="border-t bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Your Hand</h2>
                    <span className="text-sm text-muted-foreground">Team {myTeam} | {hand.length} cards</span>
                </div>
                <div className="flex justify-center gap-2 flex-wrap">
                    {sortedHand.map((card, idx) => (
                        <div
                            key={`${card.suit}-${card.rank}-${idx}`}
                            className="relative w-24 h-36 shadow-lg hover:-translate-y-2 hover:shadow-2xl transition-all cursor-pointer"
                        >
                            <img
                                src={getCardImage(card.suit, card.rank)}
                                alt={`${card.rank} of ${card.suit}`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
