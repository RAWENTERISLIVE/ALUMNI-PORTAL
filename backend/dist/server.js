"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const node_fs_1 = __importDefault(require("node:fs"));
const compression_1 = __importDefault(require("compression"));
const errorHandler_1 = require("./middleware/errorHandler");
require("./middleware/auth");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const posts_1 = __importDefault(require("./routes/posts"));
const jobs_1 = __importDefault(require("./routes/jobs"));
const events_1 = __importDefault(require("./routes/events"));
const groups_1 = __importDefault(require("./routes/groups"));
const mentorship_1 = __importDefault(require("./routes/mentorship"));
const comments_1 = __importDefault(require("./routes/comments"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const reports_1 = __importDefault(require("./routes/reports"));
const status_1 = __importDefault(require("./routes/status"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const linkedin_1 = __importDefault(require("./routes/linkedin"));
const search_1 = __importDefault(require("./routes/search"));
const helpTickets_1 = __importDefault(require("./routes/helpTickets"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = Number.parseInt(process.env.PORT || '5000', 10);
const PORT_RETRY_DELAY_MS = 400;
const MAX_PORT_RETRIES = 15;
const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS || '1', 10);
const REQUEST_BODY_LIMIT = process.env.REQUEST_BODY_LIMIT || '1mb';
const URL_ENCODED_BODY_LIMIT = process.env.URL_ENCODED_BODY_LIMIT || '1mb';
const KEEP_ALIVE_TIMEOUT_MS = Number.parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS || '65000', 10);
const HEADERS_TIMEOUT_MS = Number.parseInt(process.env.HEADERS_TIMEOUT_MS || '66000', 10);
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.REQUEST_TIMEOUT_MS || '30000', 10);
let activeServer = null;
const uploadsDir = node_path_1.default.join(__dirname, '../uploads');
if (!node_fs_1.default.existsSync(uploadsDir)) {
    node_fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads directory:', uploadsDir);
}
const initializeApp = async () => {
    try {
        console.log('🚀 Starting Alma Connect Sphere Backend...');
        console.log('📋 Phase 1: Core Authentication & Security + Profiles');
        console.log('✅ Application initialized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize application:', error);
        process.exit(1);
    }
};
initializeApp();
app.set('trust proxy', TRUST_PROXY_HOPS);
app.disable('x-powered-by');
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (process.env.NODE_ENV === 'production') {
            const allowedOrigin = process.env.FRONTEND_URL;
            callback(null, !!allowedOrigin && origin === allowedOrigin);
            return;
        }
        const isLocalhostOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
        callback(null, isLocalhostOrigin);
    },
    credentials: true
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express_1.default.urlencoded({ extended: true, limit: URL_ENCODED_BODY_LIMIT }));
app.use('/uploads', express_1.default.static(node_path_1.default.join(__dirname, '../uploads')));
app.use('/api/status', status_1.default);
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/jobs', jobs_1.default);
app.use('/api/events', events_1.default);
app.use('/api/groups', groups_1.default);
app.use('/api/mentorship', mentorship_1.default);
app.use('/api', comments_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/linkedin', linkedin_1.default);
app.use('/api/search', search_1.default);
app.use('/api/help-tickets', helpTickets_1.default);
app.use(errorHandler_1.errorHandler);
app.get('/api', (_req, res) => {
    res.send('Alumni Connect API is running');
});
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
const startServer = (port, attempt = 0) => {
    const server = app.listen(port);
    server.on('listening', () => {
        activeServer = server;
        server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
        server.headersTimeout = HEADERS_TIMEOUT_MS;
        server.requestTimeout = REQUEST_TIMEOUT_MS;
        console.log(`Server running on port ${port}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`API base URL: http://localhost:${port}/api`);
    });
    server.on('error', (err) => {
        if (err?.code === 'EADDRINUSE' && port === PORT && attempt < MAX_PORT_RETRIES) {
            const nextAttempt = attempt + 1;
            console.warn(`Port ${port} is busy (retry ${nextAttempt}/${MAX_PORT_RETRIES})...`);
            setTimeout(() => {
                startServer(port, nextAttempt);
            }, PORT_RETRY_DELAY_MS);
            return;
        }
        if (err?.code === 'EADDRINUSE') {
            console.error(`Port ${port} is already in use.`);
            console.error('Stop the existing backend process on this port and restart the app.');
            process.exit(1);
            return;
        }
        console.error('Server error:', err);
        process.exit(1);
    });
};
const shutdown = (signal) => {
    console.info(`${signal} received, shutting down server`);
    if (!activeServer) {
        process.exit(0);
        return;
    }
    activeServer.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
};
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
startServer(PORT);
exports.default = app;
//# sourceMappingURL=server.js.map