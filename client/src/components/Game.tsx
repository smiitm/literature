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

    // Sort hand by suit and rank
    const sortedHand = [...hand].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.rank.localeCompare(b.rank);
    });

    useEffect(() => {
        // Listen for game updates (turns, etc.) - to be implemented fully in Phase 2/3
        // For now, just basic setup
    }, []);

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
                </div>
                <div className="flex gap-4">
                    <div className="text-blue-500 font-bold">Team A: 0</div>
                    <div className="text-green-500 font-bold">Team B: 0</div>
                </div>
            </div>

            {/* Main Game Area (Table) */}
            <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
                <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                    {/* Other Players (Simplified view) */}
                    {players.filter(p => p.id !== socket.id).map((p) => (
                        <div key={p.id} className={`p-4 rounded-lg border bg-card text-center ${players[turnIndex]?.id === p.id ? 'ring-2 ring-primary' : ''}`}>
                            <div className="font-semibold">{p.name}</div>
                            <div className="text-xs text-muted-foreground">Team {p.team}</div>
                            <div className="mt-2 text-sm">Cards: ?</div>
                        </div>
                    ))}
                </div>
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
