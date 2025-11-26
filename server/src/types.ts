export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export interface Player {
    id: string;
    name: string;
    hand: Card[];
    team: 'A' | 'B' | null;
    isOwner: boolean;
}

export interface GameState {
    roomId: string;
    status: 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
    players: Player[];
    settings: {
        maxPlayers: number;
    };
}
