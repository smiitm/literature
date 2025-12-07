import { getTeamColor } from '@/lib/gameUtils';
import type { Player } from '@/types';

interface PlayerGridProps {
    players: Player[];
    turnIndex: number;
    playerId: string;
}

export function PlayerGrid({ players, turnIndex }: PlayerGridProps) {

    const teamA = players.filter(p => p.team === 'A'); // Blue
    const teamB = players.filter(p => p.team === 'B'); // Yellow

    const playersPerTeam = teamA.length;

    const row1: Player[] = [];
    const row2: Player[] = [];
    
    let aIndex = 0;
    let bIndex = 0;
    
    for (let i = 0; i < playersPerTeam; i++) {
        if (i % 2 === 0) {
            row1.push(teamA[aIndex++]);
        } else {
            row1.push(teamB[bIndex++]);
        }
    }
    for (let i = 0; i < playersPerTeam; i++) {
        if (i % 2 === 0) {
            row2.push(teamB[bIndex++]);
        } else {
            row2.push(teamA[aIndex++]);
        }
    }

    const renderPlayerCard = (player: Player) => {
        const hasNoCards = (player.cardCount ?? 0) === 0;
        
        return (
            <div
                key={player.id}
                className={`
                    relative p-4 rounded-lg border-2 transition-all text-white w-48
                    ${players[turnIndex]?.id === player.id ? 'ring-4 ring-white/50' : ''}
                    ${hasNoCards ? 'opacity-50 grayscale' : ''}
                `}
                style={{ backgroundColor: getTeamColor(player.team) }}
            >
                <div className="text-center">
                    <div className="text-xl font-bold truncate">{player.name}</div>
                    <span className="mt-1 text-lg font-semibold">{player.cardCount ?? 0}</span>
                    <span className="text-sm opacity-90"> Cards</span>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 p-6 flex items-center justify-center bg-muted/20">
            <div className="flex flex-col gap-4">
                <div className="flex gap-4 justify-center">
                    {row1.map(player => renderPlayerCard(player))}
                </div>
                <div className="flex gap-4 justify-center">
                    {row2.map(player => renderPlayerCard(player))}
                </div>
            </div>
        </div>
    );
}
