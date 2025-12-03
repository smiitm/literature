export type Suit = 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | 'Red' | 'Black';

export interface Card {
    suit: Suit;
    rank: Rank;
}

export interface Player {
    id: string; // socket.id - changes on reconnect
    playerId: string; // persistent UUID - stays same across reconnects
    name: string;
    hand: Card[];
    team: 'A' | 'B' | null;
    isOwner: boolean;
}

export interface TeamState {
    score: number;
}

export interface CompletedSet {
    setName: string;
    completedBy: 'A' | 'B' | 'Discarded';
}

export interface LastAsk {
    askerName: string;
    targetName: string;
    card: Card;
    success: boolean;
}

export interface GameState {
    roomId: string;
    status: 'LOBBY' | 'IN_GAME' | 'GAME_OVER';
    players: Player[];
    gameData: {
        turnIndex: number;
        log: string[];
        teams: {
            A: TeamState;
            B: TeamState;
        };
        lastAsk?: LastAsk;
        completedSets: CompletedSet[];
        turnState: 'NORMAL' | 'PASSING_TURN'; // if the current player has to pass their turn.
        winner?: 'A' | 'B' | 'DRAW';
    };
}

