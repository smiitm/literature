import { socket } from '../socket';
import { disconnectSocket, getPlayerId } from '../lib/socketManager';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types';
import { getTeamColor } from '@/lib/gameUtils';
import { Crown, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface LobbyProps {
    roomId: string;
    players: Player[];
}

export function Lobby({ roomId, players }: LobbyProps) {
    const [copied, setCopied] = useState(false);
    const currentPlayer = players.find(p => p.playerId === getPlayerId());
    const isOwner = currentPlayer?.isOwner ?? false;

    const teamA = players.filter(p => p.team === 'A');
    const teamB = players.filter(p => p.team === 'B');
    const unassigned = players.filter(p => p.team === null);

    const handleLeaveRoom = () => {
        disconnectSocket();
        window.location.reload();
    };

    const handleStartGame = () => {
        socket.emit('start_game', { roomId, playerId: getPlayerId() });
    };

    const handleJoinTeam = (team: 'A' | 'B') => {
        socket.emit('select_team', { roomId, playerId: getPlayerId(), team });
    };

    const handleCopyRoomId = async () => {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const allPlayersAssigned = unassigned.length === 0;
    const teamsBalanced = teamA.length === teamB.length;
    const canStartGame = allPlayersAssigned && teamsBalanced && players.length >= 4;

    const PlayerRow = ({ player }: { player: Player }) => (
        <li className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded">
            <div className="flex items-center gap-2">
                <span className="font-medium">{player.name}</span>
                {player.playerId === getPlayerId() && (
                    <span className="text-xs text-muted-foreground">(You)</span>
                )}
            </div>
            {player.isOwner && <Crown className="w-4 h-4 text-yellow-500" />}
        </li>
    );

    const TeamSection = ({ team, teamPlayers }: { team: 'A' | 'B'; teamPlayers: Player[] }) => {
        const isInThisTeam = currentPlayer?.team === team;
        const teamColor = getTeamColor(team);
        const joinedBackground = `${teamColor}33`;

        return (
            <div className="border-l-4 pl-4" style={{ borderLeftColor: teamColor }}>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold" style={{ color: teamColor }}>Team {team}</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{teamPlayers.length} players</span>
                        {isInThisTeam ? (
                            <span
                                className="text-xs px-2 py-1 rounded font-medium"
                                style={{ backgroundColor: joinedBackground, color: teamColor }}
                            >
                                Joined
                            </span>
                        ) : (
                            <button
                                onClick={() => handleJoinTeam(team)}
                                className="text-xs px-2 py-1 rounded font-medium text-white cursor-pointer transition-opacity hover:opacity-90"
                                style={{ backgroundColor: teamColor }}
                            >
                                Join
                            </button>
                        )}
                    </div>
                </div>
                {teamPlayers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No players yet</p>
                ) : (
                    <ul className="divide-y divide-border">
                        {teamPlayers.map(p => <PlayerRow key={p.id} player={p} />)}
                    </ul>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4">
            {/* Header */}
            <div className="text-center mb-6 mt-8">
                <h1 className="text-3xl font-bold mb-2">Game Lobby</h1>
                <div className="flex items-center justify-center gap-2">
                    <span className="text-muted-foreground text-sm">Room:</span>
                    <code className="bg-muted px-2 py-0.5 rounded font-mono font-bold">{roomId}</code>
                    <Button variant="ghost" size="sm" onClick={handleCopyRoomId} className="h-7 w-7 p-0">
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full max-w-3xl">
                <div className="flex gap-6 flex-col md:flex-row">
                    {/* Teams */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-card border rounded-lg p-5">
                            <TeamSection team="A" teamPlayers={teamA} />
                        </div>
                        <div className="bg-card border rounded-lg p-5">
                            <TeamSection team="B" teamPlayers={teamB} />
                        </div>
                    </div>

                    {/* Unassigned */}
                    <div className="md:w-64 bg-card border rounded-lg p-5">
                        <h3 className="font-semibold text-muted-foreground mb-3">
                            Waiting to Choose ({unassigned.length})
                        </h3>
                        {unassigned.length === 0 ? (
                            <p className="text-sm text-muted-foreground">All players assigned</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {unassigned.map(p => <PlayerRow key={p.id} player={p} />)}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Status & Actions */}
                <div className="mt-6 bg-card border rounded-lg p-4 flex flex-row items-center justify-between gap-4">
                    <div className="text-sm">
                        {players.length < 4 && (
                            <span className="text-amber-500">⚠️ Need {4 - players.length} more player{4 - players.length > 1 ? 's' : ''}</span>
                        )}
                        {players.length >= 4 && !allPlayersAssigned && (
                            <span className="text-amber-500">⚠️ All players must choose a team</span>
                        )}
                        {players.length >= 4 && allPlayersAssigned && !teamsBalanced && (
                            <span className="text-amber-500">⚠️ Teams unbalanced ({teamA.length} vs {teamB.length})</span>
                        )}
                        {canStartGame && (
                            <span className="text-green-500">✓ Ready to start</span>
                        )}
                    </div>

                    <div className="flex gap-3">
                        {isOwner ? (
                            <Button size="sm" onClick={handleStartGame} disabled={!canStartGame}>
                                Start Game
                            </Button>
                        ) : (
                            <span className="text-sm text-foreground py-2">
                                Waiting for {players.find(p => p.isOwner)?.name || 'owner'} to start
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={handleLeaveRoom}>
                            Leave
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
