import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { disconnectSocket } from '@/lib/socketManager';

export function LeaveRoom() {
    const [open, setOpen] = useState(false);

    const handleLeaveRoom = () => {
        disconnectSocket();
        window.location.reload();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Leave
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Leave Room</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to leave the game? You won't be able to rejoin this room.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleLeaveRoom}>
                        Leave Game
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
