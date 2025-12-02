import { Card, Suit, Rank } from './types';

export const generateRoomId = () => {
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
    const [range, suit] = setName.split(' ');
    const ranks = range === 'Low'
        ? ['A', '2', '3', '4', '5', '6']
        : ['8', '9', '10', 'J', 'Q', 'K'];

    return ranks.map(rank => ({ suit: suit as Suit, rank: rank as Rank }));
};
