"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production'
                ? process.env.FRONTEND_URL
                : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'],
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log(`🔌 New client connected: ${socket.id}`);
        socket.on('join_group', (groupId) => {
            socket.join(`group_${groupId}`);
            console.log(`User ${socket.id} joined group_${groupId}`);
        });
        socket.on('leave_group', (groupId) => {
            socket.leave(`group_${groupId}`);
            console.log(`User ${socket.id} left group_${groupId}`);
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map