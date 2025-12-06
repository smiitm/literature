import { getCardImage } from '@/lib/gameUtils';
import type { Card } from '@/types';
import { useState, useEffect } from 'react';

const CARD_WIDTH = 112;
const MAX_CONTAINER_WIDTH = 800;
const BASE_CARD_SPACING = 50;

interface PlayerHandProps {
    hand: Card[];
    myTeam: 'A' | 'B' | null;
    playerName: string;
}

export function PlayerHand({ hand, myTeam, playerName }: PlayerHandProps) {
    const [orderedHand, setOrderedHand] = useState<Card[]>(hand);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    useEffect(() => {
        setOrderedHand(prev => {
            const handSet = new Set(hand.map(c => `${c.suit}-${c.rank}`));
            const prevSet = new Set(prev.map(c => `${c.suit}-${c.rank}`));
            const kept = prev.filter(c => handSet.has(`${c.suit}-${c.rank}`));
            const newCards = hand.filter(c => !prevSet.has(`${c.suit}-${c.rank}`));
            return [...kept, ...newCards];
        });
    }, [hand]);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        const emptyImg = document.createElement('img');
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) return;
        setOrderedHand(prev => {
            const newHand = [...prev];
            const [draggedCard] = newHand.splice(draggedIndex, 1);
            newHand.splice(dropIndex, 0, draggedCard);
            return newHand;
        });
        setDraggedIndex(null);
    };

    const handleDragEnd = () => setDraggedIndex(null);

    const sortCards = () => {
        const suitOrder = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
        const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        setOrderedHand(prev => [...prev].sort((a, b) => {
            const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            if (suitDiff !== 0) return suitDiff;
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        }));
    };

    const cardCount = orderedHand.length;
    const spacing = Math.min(BASE_CARD_SPACING, (MAX_CONTAINER_WIDTH - CARD_WIDTH) / Math.max(cardCount - 1, 1));
    const containerWidth = cardCount > 1 ? (cardCount - 1) * spacing + CARD_WIDTH : CARD_WIDTH;

    return (
        <div className="border-t bg-card p-4">
            <div className="flex gap-6">
                <div className="flex flex-col min-w-[120px]">
                    <h2 className="text-2xl font-semibold">{playerName}</h2>
                    <span className="text-md text-muted-foreground">{hand.length} cards | Team {myTeam}</span>
                    <button onClick={sortCards} className="px-3 py-1 text-sm rounded bg-muted w-fit mt-1">Sort cards</button>
                </div>
                <div className="flex-1 flex justify-center">
                    <div className="relative h-44" style={{ width: containerWidth }}>
                        {orderedHand.map((card, idx) => (
                            <div
                                key={`${card.suit}-${card.rank}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, idx)}
                                onDragEnd={handleDragEnd}
                                className={`absolute w-28 h-44 cursor-grab active:cursor-grabbing ${draggedIndex === idx ? 'opacity-50' : ''}`}
                                style={{ left: idx * spacing, zIndex: idx }}
                            >
                                <img
                                    src={getCardImage(card.suit, card.rank)}
                                    alt={`${card.rank} of ${card.suit}`}
                                    className="w-full h-full object-contain pointer-events-none select-none"
                                    draggable={false}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
