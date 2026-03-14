"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
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
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
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
const startServer = (port) => {
    try {
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`API base URL: http://localhost:${port}/api`);
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`Port ${port} is already in use, trying port ${port + 1}`);
                startServer(port + 1);
            }
            else {
                console.error('Server error:', err);
            }
        });
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
        });
        process.on('SIGTERM', () => {
            console.info('SIGTERM received, shutting down server');
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
    catch (error) {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use, trying port ${port + 1}`);
            const newPort = port + 1;
            startServer(newPort);
        }
        else {
            console.error('Server error:', error);
            process.exit(1);
        }
    }
};
startServer(PORT);
exports.default = app;
//# sourceMappingURL=server.js.map