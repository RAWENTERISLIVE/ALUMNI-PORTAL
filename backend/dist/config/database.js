"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoURI) {
            throw new Error('MongoDB URI is not defined in environment variables. Please set MONGODB_URI.');
        }
        console.log('🔌 Attempting to connect to MongoDB...');
        console.log('🔗 URI format check:', mongoURI.includes('mongodb+srv') ? 'Atlas connection' : 'Local connection');
        const conn = await mongoose_1.default.connect(mongoURI, {
            retryWrites: true,
            w: 'majority',
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
        mongoose_1.default.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected');
        });
        mongoose_1.default.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed due to app termination');
            process.exit(0);
        });
    }
    catch (error) {
        console.error('Error connecting to MongoDB:', error);
        console.log('💡 Suggestion: Check your MongoDB Atlas connection string and network connectivity');
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        }
        else {
            console.warn('⚠️  Running in development mode without database connection');
        }
    }
};
exports.connectDB = connectDB;
//# sourceMappingURL=database.js.map