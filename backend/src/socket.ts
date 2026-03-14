import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Join a specific group/room
    socket.on('join_group', (groupId: string) => {
      socket.join(`group_${groupId}`);
      console.log(`User ${socket.id} joined group_${groupId}`);
    });

    // Leave a specific group/room
    socket.on('leave_group', (groupId: string) => {
      socket.leave(`group_${groupId}`);
      console.log(`User ${socket.id} left group_${groupId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};