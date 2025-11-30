import { useState, useEffect } from 'react';
import { socket } from '../socket';

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
    const [declarationMap, setDeclarationMap] = useState<{ [key: string]: string }>({}); // "Rank-Suit": "PlayerId"

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
                { suit: 'Joker', rank: 'Big' },
                { suit: 'Joker', rank: 'Small' }
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
        // Reset selection
        setAskRank('');
        setAskSuit('');
    };

    const handleDeclare = () => {
        const cards = getSetCards(declareSet);
        const declaration = cards.map(c => ({
            card: c,
            playerId: declarationMap[`${c.rank}-${c.suit}`]
        }));

        // Validate all filled
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
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Big', 'Small'];

    if (winner) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background text-foreground gap-8">
                <h1 className="text-6xl font-bold animate-bounce">
                    {winner === 'DRAW' ? 'It\'s a Draw!' : `Team ${winner} Wins!`}
                </h1>
                <div className="text-2xl">
                    Final Score - Team A: {scores.A} | Team B: {scores.B}
                </div>
                <button
                    className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-xl font-bold hover:bg-primary/90"
                    onClick={() => window.location.reload()}
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Header / Game Info */}
            <div className="p-4 border-b flex justify-between items-center bg-card">
                <div>
                    <h1 className="text-xl font-bold">Literature</h1>
                    <p className="text-sm text-muted-foreground">You are in Team {myTeam}</p>
                </div>
                <div className="text-center">
                    <div className="text-lg font-semibold">
                        Turn: {players[turnIndex]?.name}
                    </div>
                    {isMyTurn && <div className="text-green-500 font-bold animate-pulse">YOUR TURN</div>}
                </div>
                <div className="flex gap-4">
                    <div className="text-blue-500 font-bold">Team A: {scores.A}</div>
                    <div className="text-green-500 font-bold">Team B: {scores.B}</div>
                </div>
            </div>

            {/* Last Ask Display */}
            {lastAsk && (
                <div className="bg-muted p-2 text-center text-sm border-b">
                    <span className="font-bold">{lastAsk.askerName}</span> asked <span className="font-bold">{lastAsk.targetName}</span> for <span className="font-bold">{lastAsk.card.rank} of {lastAsk.card.suit}</span>
                    <span className={`ml-2 font-bold ${lastAsk.success ? 'text-green-500' : 'text-red-500'}`}>
                        {lastAsk.success ? 'SUCCESS' : 'FAIL'}
                    </span>
                </div>
            )}

            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 gap-8">

                {/* Opponents */}
                <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                    {players.filter(p => p.id !== socket.id).map((p) => (
                        <div key={p.id} className={`p-4 rounded-lg border bg-card text-center relative ${players[turnIndex]?.id === p.id ? 'ring-2 ring-primary' : ''}`}>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-muted-foreground">Team {p.team}</div>
                            <div className="mt-2 text-sm">Cards: {p.cardCount ?? '?'}</div>
                            {/* Visual indicator if this is the selected opponent for ask */}
                            {selectedOpponent === p.id && <div className="absolute top-2 right-2 text-blue-500">🎯</div>}
                        </div>
                    ))}
                </div>

                {/* Action Area (Ask / Declare / Pass) */}
                {isMyTurn && (
                    <div className="flex flex-col gap-4 w-full max-w-4xl items-center">
                        {turnState === 'PASSING_TURN' ? (
                            <div className="bg-card p-6 rounded-lg border shadow-lg flex flex-col gap-4 items-center">
                                <h3 className="text-xl font-bold text-destructive">You have no cards! Pass your turn.</h3>
                                <select
                                    className="p-2 border rounded bg-background w-64"
                                    value={passTarget}
                                    onChange={(e) => setPassTarget(e.target.value)}
                                >
                                    <option value="">Select Teammate...</option>
                                    {players.filter(p => p.team === myTeam && p.id !== socket.id).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
                                    onClick={handlePassTurn}
                                    disabled={!passTarget}
                                >
                                    Pass Turn
                                </button>
                            </div>
                        ) : (
                            <div className="bg-card p-4 rounded-lg border shadow-lg flex gap-4 items-end">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold">Ask Opponent</label>
                                    <select
                                        className="p-2 border rounded bg-background"
                                        value={selectedOpponent}
                                        onChange={(e) => setSelectedOpponent(e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        {opponents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold">Rank</label>
                                    <select
                                        className="p-2 border rounded bg-background"
                                        value={askRank}
                                        onChange={(e) => setAskRank(e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        {ranks.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold">Suit</label>
                                    <select
                                        className="p-2 border rounded bg-background"
                                        value={askSuit}
                                        onChange={(e) => setAskSuit(e.target.value)}
                                    >
                                        <option value="">Select...</option>
                                        {suits.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <button
                                    className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
                                    onClick={handleAsk}
                                    disabled={!selectedOpponent || !askRank || !askSuit}
                                >
                                    Ask Card
                                </button>

                                <button
                                    className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90 ml-4"
                                    onClick={() => setIsDeclaring(!isDeclaring)}
                                >
                                    {isDeclaring ? 'Cancel Declare' : 'Declare Set'}
                                </button>
                            </div>
                        )}

                        {/* Declaration Form */}
                        {isDeclaring && (
                            <div className="bg-card p-4 rounded-lg border shadow-lg w-full max-w-2xl">
                                <h3 className="font-bold mb-4">Declare Set</h3>
                                <div className="flex gap-4 mb-4">
                                    <select
                                        className="p-2 border rounded bg-background flex-1"
                                        value={declareSet}
                                        onChange={(e) => setDeclareSet(e.target.value)}
                                    >
                                        <option value="">Select Set...</option>
                                        <option value="Low Spades">Low Spades (A-6)</option>
                                        <option value="High Spades">High Spades (8-K)</option>
                                        <option value="Low Hearts">Low Hearts (A-6)</option>
                                        <option value="High Hearts">High Hearts (8-K)</option>
                                        <option value="Low Clubs">Low Clubs (A-6)</option>
                                        <option value="High Clubs">High Clubs (8-K)</option>
                                        <option value="Low Diamonds">Low Diamonds (A-6)</option>
                                        <option value="High Diamonds">High Diamonds (8-K)</option>
                                        <option value="Sevens">Sevens (7s + Jokers)</option>
                                    </select>
                                </div>

                                {declareSet && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {getSetCards(declareSet).map((card) => (
                                            <div key={`${card.rank}-${card.suit}`} className="flex items-center justify-between border p-2 rounded">
                                                <span className={`${getSuitColor(card.suit)} font-bold`}>
                                                    {card.rank} {getSuitIcon(card.suit)}
                                                </span>
                                                <select
                                                    className="p-1 border rounded bg-background text-sm"
                                                    value={declarationMap[`${card.rank}-${card.suit}`] || ''}
                                                    onChange={(e) => setDeclarationMap(prev => ({
                                                        ...prev,
                                                        [`${card.rank}-${card.suit}`]: e.target.value
                                                    }))}
                                                >
                                                    <option value="">Select Holder...</option>
                                                    {players.filter(p => p.team === myTeam).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} {p.id === socket.id ? '(You)' : ''}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                                    onClick={handleDeclare}
                                    disabled={!declareSet || getSetCards(declareSet).some(c => !declarationMap[`${c.rank}-${c.suit}`])}
                                >
                                    Submit Declaration
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Player's Hand */}
            <div className="p-6 bg-card border-t">
                <h2 className="text-lg font-semibold mb-4 text-center">Your Hand</h2>
                <div className="flex justify-center gap-2 flex-wrap">
                    {sortedHand.map((card, idx) => (
                        <div
                            key={`${card.suit}-${card.rank}-${idx}`}
                            className={`
                                w-24 h-36 rounded-lg border-2 flex flex-col items-center justify-center bg-background shadow-sm hover:-translate-y-2 transition-transform cursor-pointer
                                ${getSuitColor(card.suit)}
                            `}
                        >
                            <div className="text-2xl">{card.rank}</div>
                            <div className="text-4xl">{getSuitIcon(card.suit)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
