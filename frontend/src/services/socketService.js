import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token, sessionId) {
    if (this.socket) {
      this.disconnect();
    }
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      query: { sessionId },
      withCredentials: true,
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onReceiveMessage(callback) {
    if (!this.socket) return;
    this.socket.on('receive_message', callback);
  }

  offReceiveMessage(callback) {
    if (!this.socket) return;
    this.socket.off('receive_message', callback);
  }

  sendMessage(receiverId, content) {
    if (!this.socket) return;
    this.socket.emit('send_message', { receiverId, content });
  }

  emit(event, data) {
    if (!this.socket) return;
    this.socket.emit(event, data);
  }

  on(event, callback) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event, callback) {
    if (!this.socket) return;
    this.socket.off(event, callback);
  }
}

export default new SocketService();
