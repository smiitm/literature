import { socket } from '../socket';

const STORAGE_KEY = 'lit_game_session';

interface SessionData {
    roomId: string;
    playerName: string;
}

export function connectSocket(): Promise<void> {
    return new Promise((resolve) => {
        if (socket.connected) {
            resolve();
            return;
        }

        socket.connect();
        socket.once('connect', () => {
            resolve();
        });
    });
}

export function disconnectSocket() {
    socket.disconnect();
    clearSession();
}

export function saveSession(roomId: string, playerName: string) {
    const data: SessionData = { roomId, playerName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getSession(): SessionData | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    try {
        return JSON.parse(data);
    } catch {
        return null;
    }
}

export function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
}
