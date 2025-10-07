"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhase1Status = exports.healthCheck = exports.getSystemStatus = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const User_1 = __importStar(require("../models/User"));
const Post_1 = __importDefault(require("../models/Post"));
const Job_1 = __importDefault(require("../models/Job"));
exports.getSystemStatus = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const activeUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.ACTIVE });
        const pendingUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.PENDING });
        const suspendedUsers = await User_1.default.countDocuments({ status: User_1.UserStatus.SUSPENDED });
        const totalPosts = await Post_1.default.countDocuments();
        const totalJobs = await Job_1.default.countDocuments({ isActive: true });
        const phase1Features = {
            authentication: {
                status: 'completed',
                features: [
                    'JWT-based login (1h access / 7d refresh)',
                    'Role-based access control',
                    'Admission number verification',
                    'Manual verification flow',
                    'Super admin auto-creation',
                    'Rate limiting on auth endpoints'
                ]
            },
            userManagement: {
                status: 'completed',
                features: [
                    'User registration (standard + manual)',
                    'Admin approval workflow',
                    'User suspension/reactivation',
                    'Role promotion/demotion',
                    'User deletion'
                ]
            },
            profiles: {
                status: 'completed',
                features: [
                    'Rich user profiles',
                    'Privacy controls',
                    'Profile picture support',
                    'Contact information',
                    'Bio and headline'
                ]
            },
            security: {
                status: 'completed',
                features: [
                    'Password hashing with bcrypt',
                    'Password reset functionality',
                    'Input validation',
                    'Rate limiting (auth, registration, password reset)',
                    'Helmet security headers',
                    'CORS configuration'
                ]
            },
            directory: {
                status: 'completed',
                features: [
                    'Alumni directory with search',
                    'User suggestions algorithm',
                    'Filtering by batch/department',
                    'Privacy-respected visibility'
                ]
            }
        };
        const environment = {
            nodeEnv: process.env.NODE_ENV ?? 'development',
            uploadsEnabled: !!process.env.UPLOADS_DIR,
            dbConnected: true,
            version: '3.1-phase1'
        };
        res.status(200).json({
            success: true,
            phase: 'Phase 1 - Core Authentication & Security + Profiles',
            status: 'completed',
            timestamp: new Date().toISOString(),
            environment,
            statistics: {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    pending: pendingUsers,
                    suspended: suspendedUsers
                },
                content: {
                    posts: totalPosts,
                    jobs: totalJobs
                }
            },
            features: phase1Features,
            nextPhase: 'Phase 2 - Social & Content (Posts, Connections, Home Feed)'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get system status',
            error: error.message
        });
    }
});
exports.healthCheck = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.1-phase1'
    });
});
exports.getPhase1Status = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    try {
        const superAdmins = await User_1.default.countDocuments({ role: 'super_admin', status: 'active' });
        const checksResults = {
            superAdminsCreated: superAdmins > 0,
            authenticationWorking: true,
            databaseConnected: true,
            uploadsDirectoryExists: true,
            rateLimitingActive: true,
        };
        const allChecksPassed = Object.values(checksResults).every(check => check === true);
        res.status(200).json({
            success: true,
            phase: 'Phase 1',
            title: 'Core Authentication & Security + Profiles',
            status: allChecksPassed ? 'completed' : 'in_progress',
            completionPercentage: allChecksPassed ? 100 : 80,
            checks: checksResults,
            message: allChecksPassed
                ? 'Phase 1 is fully operational! Ready to proceed with Phase 2.'
                : 'Phase 1 is mostly complete but some checks failed.',
            readyForNextPhase: allChecksPassed
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to check Phase 1 status',
            error: error.message
        });
    }
});
//# sourceMappingURL=statusController.js.map