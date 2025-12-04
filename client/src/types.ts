export interface Player {
    id: string;
    playerId: string;
    name: string;
    team: 'A' | 'B' | null;
    isOwner: boolean;
    cardCount?: number;
}

export interface Card {
    suit: 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
    rank: string;
}

export interface LastAsk {
    askerName: string;
    targetName: string;
    card: Card;
    success: boolean;
}

export interface CompletedSet {
    setName: string;
    completedBy: 'A' | 'B' | 'Discarded';
}
