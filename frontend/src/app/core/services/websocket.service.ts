import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket;
    private readonly URL = 'http://localhost:3000'; // Configure properly for environment

    constructor() {
        this.socket = io(this.URL);
    }

    joinChapter(chapterId: string) {
        this.socket.emit('join:chapter', chapterId);
    }

    leaveChapter(chapterId: string) {
        this.socket.emit('leave:chapter', chapterId);
    }

    onEvent(event: string): Observable<any> {
        return new Observable((observer) => {
            this.socket.on(event, (data) => {
                observer.next(data);
            });
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}
