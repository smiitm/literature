import { Card, Suit, Rank, Player } from './types';

export const generateRoomId = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getSetName = (card: Card): string => {
    if (card.rank === '7' || card.suit === 'Joker') return 'Sevens';
    if (['A', '2', '3', '4', '5', '6'].includes(card.rank)) return `Low ${card.suit}`;
    if (['8', '9', '10', 'J', 'Q', 'K'].includes(card.rank)) return `High ${card.suit}`;
    return 'Unknown';
};

export const getSetCards = (setName: string): Card[] => {
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
    
    const match = setName.match(/^(Low|High) (Spades|Hearts|Clubs|Diamonds)$/);
    if (!match) {
        throw new Error(`Invalid set name: ${setName}`);
    }
    
    const [, range, suit] = match;
    const ranks = range === 'Low'
        ? ['A', '2', '3', '4', '5', '6']
        : ['8', '9', '10', 'J', 'Q', 'K'];

    return ranks.map(rank => ({ suit: suit as Suit, rank: rank as Rank }));
};

// Generate a fresh 54-card deck
export const generateDeck = (): Card[] => {
    const suits: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
    const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const deck: Card[] = [];

    suits.forEach(suit => {
        ranks.forEach(rank => {
            deck.push({ suit, rank });
        });
    });
    deck.push({ suit: 'Joker', rank: 'Red' });
    deck.push({ suit: 'Joker', rank: 'Black' });

    return deck;
};

// Fisher-Yates shuffle algorithm
export const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

// Assign teams alternating A, B, A, B...
export const assignTeams = (players: Player[]): void => {
    players.forEach((player, index) => {
        player.team = index % 2 === 0 ? 'A' : 'B';
    });
};

// Distribute cards evenly among players (round-robin)
export const distributeCards = (deck: Card[], players: Player[]): void => {
    deck.forEach((card, index) => {
        const playerIndex = index % players.length;
        players[playerIndex].hand.push(card);
    });
};
