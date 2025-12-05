import { useState } from 'react';
import { socket } from '../socket';
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
import { getSuitIcon, getSuitColor, getSetCards } from '@/lib/gameUtils';
import type { Player } from '@/types';

interface DeclareSetProps {
    players: Player[];
    myTeam: 'A' | 'B' | null;
    socketId: string;
    roomId: string;
}

export function DeclareSet({ players, myTeam, socketId, roomId }: DeclareSetProps) {
    const [open, setOpen] = useState(false);
    const [declareSet, setDeclareSet] = useState<string>('');
    const [declarationMap, setDeclarationMap] = useState<{ [key: string]: string }>({});

    const handleDeclare = () => {
        const cards = getSetCards(declareSet);
        const declaration = cards.map(c => ({
            card: c,
            playerId: declarationMap[`${c.rank}-${c.suit}`]
        }));

        if (declaration.some(d => !d.playerId)) {
            alert("Please assign all cards to players.");
            return;
        }

        socket.emit('declare_set', { roomId, declaration });
        setOpen(false);
        setDeclareSet('');
        setDeclarationMap({});
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setDeclareSet('');
            setDeclarationMap({});
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Declare Set
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Declare a Set</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Select value={declareSet} onValueChange={setDeclareSet}>
                        <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select Set..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low Spades">Low Spades (A-6)</SelectItem>
                            <SelectItem value="High Spades">High Spades (8-K)</SelectItem>
                            <SelectItem value="Low Hearts">Low Hearts (A-6)</SelectItem>
                            <SelectItem value="High Hearts">High Hearts (8-K)</SelectItem>
                            <SelectItem value="Low Clubs">Low Clubs (A-6)</SelectItem>
                            <SelectItem value="High Clubs">High Clubs (8-K)</SelectItem>
                            <SelectItem value="Low Diamonds">Low Diamonds (A-6)</SelectItem>
                            <SelectItem value="High Diamonds">High Diamonds (8-K)</SelectItem>
                            <SelectItem value="Sevens">Sevens (7s + Jokers)</SelectItem>
                        </SelectContent>
                    </Select>

                    {declareSet && (
                        <>
                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {getSetCards(declareSet).map((card) => (
                                    <div key={`${card.rank}-${card.suit}`} className="flex items-center justify-between text-sm p-2 border rounded">
                                        <span className={getSuitColor(card.suit)}>
                                            {card.rank} {getSuitIcon(card.suit)}
                                        </span>
                                        <Select
                                            value={declarationMap[`${card.rank}-${card.suit}`] || ''}
                                            onValueChange={(value: string) => setDeclarationMap(prev => ({
                                                ...prev,
                                                [`${card.rank}-${card.suit}`]: value
                                            }))}
                                        >
                                            <SelectTrigger className="text-xs w-32 h-8">
                                                <SelectValue placeholder="Holder..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {players.filter(p => p.team === myTeam).map(p => (
                                                    <SelectItem key={p.playerId} value={p.playerId}>{p.name} {p.id === socketId ? '(You)' : ''}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                ))}
                            </div>
                            <Button
                                className="w-full bg-green-600 hover:bg-green-700 text-sm"
                                onClick={handleDeclare}
                                disabled={!declareSet || getSetCards(declareSet).some(c => !declarationMap[`${c.rank}-${c.suit}`])}
                            >
                                Submit Declaration
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
