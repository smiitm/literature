import { useState, useMemo, useCallback, useEffect } from 'react';
import { socket } from '../socket';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getSuitIcon, getSuitColor, getSetCards, getCardKey, ALL_SETS } from '@/lib/gameUtils';
import type { Player, Card, CompletedSet } from '@/types';

interface DeclareSetProps {
    players: Player[];
    myTeam: 'A' | 'B' | null;
    socketId: string;
    roomId: string;
    hand: Card[];
    completedSets: CompletedSet[];
}

export function DeclareSet({ players, myTeam, socketId, roomId, hand, completedSets }: DeclareSetProps) {
    const [open, setOpen] = useState(false);
    const [declareSet, setDeclareSet] = useState<string>('');
    const [declarationMap, setDeclarationMap] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const teamPlayers = useMemo(() => 
        players.filter(p => p.team === myTeam), 
        [players, myTeam]
    );

    const setCards = useMemo(() => 
        declareSet ? getSetCards(declareSet) : [], 
        [declareSet]
    );

    // Auto-assign cards that the player holds
    const myPlayerId = useMemo(() => 
        players.find(p => p.id === socketId)?.playerId || '',
        [players, socketId]
    );

    const myCardKeys = useMemo(() => 
        new Set(hand.map(c => getCardKey(c))),
        [hand]
    );

    // Auto-populate declarationMap when set changes
    useEffect(() => {
        if (declareSet && setCards.length > 0) {
            const autoAssigned: Record<string, string> = {};
            setCards.forEach(card => {
                const cardKey = getCardKey(card);
                if (myCardKeys.has(cardKey)) {
                    autoAssigned[cardKey] = myPlayerId;
                }
            });
            if (Object.keys(autoAssigned).length > 0) {
                setDeclarationMap(autoAssigned);
            }
        }
    }, [declareSet, setCards, myCardKeys, myPlayerId]);

    const allCardsAssigned = useMemo(() => 
        setCards.length > 0 && setCards.every(c => declarationMap[getCardKey(c)]),
        [setCards, declarationMap]
    );

    const handleDeclare = useCallback(() => {
        const declaration = setCards.map(c => ({
            card: c,
            playerId: declarationMap[getCardKey(c)]
        }));

        if (declaration.some(d => !d.playerId)) {
            toast.error("Please assign all cards to players.");
            return;
        }

        setIsSubmitting(true);
        socket.emit('declare_set', { roomId, declaration });
        setOpen(false);
        setDeclareSet('');
        setDeclarationMap({});
        setIsSubmitting(false);
    }, [setCards, declarationMap, roomId]);

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setDeclareSet('');
            setDeclarationMap({});
        }
    };

    const completedSetNames = useMemo(() => 
        new Set(completedSets.map(s => s.setName)),
        [completedSets]
    );

    const availableSets = ALL_SETS.filter(s => !completedSetNames.has(s.value));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Declare Set
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-4 pt-4 pb-3 border-b bg-muted/30">
                    <DialogTitle className="text-base font-semibold">Declare a Set</DialogTitle>
                </DialogHeader>
                
                <div className="p-4">
                    <Select value={declareSet} onValueChange={setDeclareSet}>
                        <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Choose a set to declare..." />
                        </SelectTrigger>
                        <SelectContent>
                            {availableSets.map(set => (
                                <SelectItem key={set.value} value={set.value}>{set.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {declareSet && (
                    <>
                        <div className="px-4">
                            <div className="space-y-1.5">
                                {setCards.map((card) => {
                                    const cardKey = getCardKey(card);
                                    const isUnassigned = !declarationMap[cardKey];
                                    const isMyCard = myCardKeys.has(cardKey);
                                    return (
                                        <div 
                                            key={cardKey} 
                                            className={`flex items-center justify-between py-2 px-3 rounded-md transition-colors ${
                                                isMyCard
                                                    ? 'bg-green-500/15 dark:bg-green-500/20'
                                                    : isUnassigned 
                                                        ? 'bg-red-500/10 dark:bg-red-500/20' 
                                                        : 'bg-muted/50 hover:bg-muted'
                                            }`}
                                        >
                                            <span className={`font-medium text-sm ${getSuitColor(card.suit)}`}>
                                                {getSuitIcon(card.suit)} {card.rank}
                                                {isMyCard && <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">(You)</span>}
                                            </span>
                                            {isMyCard ? (
                                                <span className="text-xs text-muted-foreground w-28 text-right">Auto-assigned</span>
                                            ) : (
                                                <Select
                                                    value={declarationMap[cardKey] || ''}
                                                    onValueChange={(value: string) => setDeclarationMap(prev => ({
                                                        ...prev,
                                                        [cardKey]: value
                                                    }))}
                                                >
                                                    <SelectTrigger className={`w-28 h-7 text-xs border-0 ${
                                                        isUnassigned ? 'bg-background' : 'bg-background/80'
                                                    }`}>
                                                        <SelectValue placeholder="Select..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teamPlayers.filter(p => p.id !== socketId).map(p => (
                                                            <SelectItem key={p.playerId} value={p.playerId} className="text-xs">
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-4 pt-3 border-t mt-3">
                            <Button
                                className="w-full h-9 bg-green-600 hover:bg-green-700 font-medium"
                                onClick={handleDeclare}
                                disabled={!allCardsAssigned || isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : allCardsAssigned ? '✓ Submit Declaration' : `Assign ${setCards.length - Object.keys(declarationMap).length} more cards`}
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
