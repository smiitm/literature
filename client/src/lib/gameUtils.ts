export interface Card {
    suit: 'Spades' | 'Hearts' | 'Clubs' | 'Diamonds' | 'Joker';
    rank: string;
}

export const suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds', 'Joker'];
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'Red', 'Black'];

export const getCardImage = (suit: string, rank: string) => {
    const suitLower = suit.toLowerCase();
    let rankLower = rank.toLowerCase();

    // Handle Jokers
    if (suit === 'Joker') {
        return rank === 'Red'
            ? new URL('../assets/cards/joker_red.svg', import.meta.url).href
            : new URL('../assets/cards/joker_black.svg', import.meta.url).href;
    }

    // Convert A to a for aces
    if (rank === 'A') rankLower = 'a';
    if (rank === 'J') rankLower = 'j';
    if (rank === 'Q') rankLower = 'q';
    if (rank === 'K') rankLower = 'k';

    return new URL(`../assets/cards/${suitLower}_${rankLower}.svg`, import.meta.url).href;
};

export const getSuitIcon = (suit: string) => {
    switch (suit) {
        case 'Spades': return '♠️';
        case 'Hearts': return '♥️';
        case 'Clubs': return '♣️';
        case 'Diamonds': return '♦️';
        case 'Joker': return '🃏';
        default: return '';
    }
};

export const getSuitColor = (suit: string) => {
    return ['Hearts', 'Diamonds'].includes(suit) ? 'text-red-500' : 'text-foreground';
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
    const ranks = range === 'Low'
        ? ['A', '2', '3', '4', '5', '6']
        : ['8', '9', '10', 'J', 'Q', 'K'];

    return ranks.map(rank => ({ suit: suit as any, rank }));
};
