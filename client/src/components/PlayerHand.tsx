import { getCardImage, type Card } from '@/lib/gameUtils';

interface PlayerHandProps {
    hand: Card[];
    myTeam: 'A' | 'B' | null;
}

export function PlayerHand({ hand, myTeam }: PlayerHandProps) {
    const sortedHand = [...hand].sort((a, b) => {
        if (a.suit !== b.suit) return a.suit.localeCompare(b.suit);
        return a.rank.localeCompare(b.rank);
    });

    return (
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
    );
}
