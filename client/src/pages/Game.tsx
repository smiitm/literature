import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Button } from '@/components/ui/button';
import { GameHeader } from '@/components/GameHeader';
import { PlayerGrid } from '@/components/PlayerGrid';
import { AskCard } from '@/components/AskCard';
import { PlayerHand } from '@/components/PlayerHand';
import type { Player, Card, LastAsk, CompletedSet } from '@/types';

interface GameProps {
    initialHand: Card[];
    initialTurnIndex: number;
    initialPlayers: Player[];
    myTeam: 'A' | 'B' | null;
    roomId: string;
}

export function Game({ initialHand, initialTurnIndex, initialPlayers, myTeam, roomId }: GameProps) {
    const [hand, setHand] = useState<Card[]>(initialHand);
    const [turnIndex, setTurnIndex] = useState(initialTurnIndex);
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [lastAsk, setLastAsk] = useState<LastAsk | null>(null);
    const [turnState, setTurnState] = useState<'NORMAL' | 'PASSING_TURN'>('NORMAL');
    const [winner, setWinner] = useState<'A' | 'B' | 'DRAW' | undefined>(undefined);
    const [scores, setScores] = useState<{ A: number, B: number }>({ A: 0, B: 0 });
    const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);

    const isMyTurn = players[turnIndex]?.id === socket.id;

    useEffect(() => {
        socket.on('game_update', (data) => {
            setHand(data.hand);
            setTurnIndex(data.turnIndex);
            setPlayers(data.players);
            if (data.lastAsk) setLastAsk(data.lastAsk);
            if (data.turnState) setTurnState(data.turnState);
            if (data.winner) setWinner(data.winner);
            if (data.scores) setScores(data.scores);
            if (data.completedSets) setCompletedSets(data.completedSets);
        });

        return () => {
            socket.off('game_update');
        };
    }, []);

    if (winner) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background text-foreground gap-8">
                <h1 className="text-6xl font-bold animate-bounce">
                    {winner === 'DRAW' ? 'It\'s a Draw!' : `Team ${winner} Wins!`}
                </h1>
                <div className="text-2xl">
                    Final Score - Team A: {scores.A} | Team B: {scores.B}
                </div>
                <Button
                    size="lg"
                    className="px-8 py-4 text-xl font-bold"
                    onClick={() => window.location.reload()}
                >
                    Back to Lobby
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <GameHeader
                lastAsk={lastAsk}
                scores={scores}
                completedSets={completedSets}
                players={players}
                myTeam={myTeam}
                socketId={socket.id || ''}
                roomId={roomId}
                hand={hand}
            />

            <div className="flex-1 flex overflow-hidden">
                <PlayerGrid
                    players={players}
                    turnIndex={turnIndex}
                    socketId={socket.id || ''}
                />

                <AskCard
                    isMyTurn={isMyTurn}
                    players={players}
                    turnState={turnState}
                    myTeam={myTeam}
                    socketId={socket.id || ''}
                    roomId={roomId}
                />
            </div>

            <PlayerHand hand={hand} myTeam={myTeam} />
        </div>
    );
}
