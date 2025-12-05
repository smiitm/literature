import type { Card } from '@/types';

export const suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds', 'Joker'] as const;
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Red', 'Black'] as const;

const LOW_RANKS = ['A', '2', '3', '4', '5', '6'] as const;
const HIGH_RANKS = ['8', '9', '10', 'J', 'Q', 'K'] as const;
const RED_SUITS = ['Hearts', 'Diamonds'] as const;

export const getCardImage = (suit: string, rank: string) => {
    const suitLower = suit.toLowerCase();
    let rankLower = rank.toLowerCase();

    if (suit === 'Joker') {
        return rank === 'Red'
            ? new URL('../assets/cards/joker_red.svg', import.meta.url).href
            : new URL('../assets/cards/joker_black.svg', import.meta.url).href;
    }

    return new URL(`../assets/cards/${suitLower}_${rankLower}.svg`, import.meta.url).href;
};

const SUIT_ICONS: Record<string, string> = {
    Spades: '♠️',
    Hearts: '♥️',
    Clubs: '♣️',
    Diamonds: '♦️',
    Joker: '🃏',
};

export const getSuitIcon = (suit: string) => SUIT_ICONS[suit] ?? '';

export const getSuitColor = (suit: string) => {
    return (RED_SUITS as readonly string[]).includes(suit) ? 'text-red-500' : 'text-foreground';
};

export const getTeamColor = (team: 'A' | 'B' | null) => {
    if (team === 'A') return '#3b82f6';
    if (team === 'B') return '#eab308';
    return '#888';
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
    if (!setName) return [];
    const [range, suit] = setName.split(' ');
    const setRanks = range === 'Low' ? LOW_RANKS : HIGH_RANKS;

    return setRanks.map(rank => ({ suit: suit as any, rank }));
};
