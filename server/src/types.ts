export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'Big' | 'Small';

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

export interface TeamState {
    score: number;
    declaredSets: string[];
}

export interface GameState {
    roomId: string;
    status: 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
    players: Player[];
    settings: {
        maxPlayers: number;
    };
    gameData: {
        deck: Card[];
        turnIndex: number;
        teams: {
            A: TeamState;
            B: TeamState;
        };
        log: string[];
        lastAsk?: LastAsk;
        discardedSets: string[];
        turnState: 'NORMAL' | 'PASSING_TURN';
        winner?: 'A' | 'B' | 'DRAW';
    };
}

export interface LastAsk {
    askerName: string;
    targetName: string;
    card: Card;
    success: boolean;
}
