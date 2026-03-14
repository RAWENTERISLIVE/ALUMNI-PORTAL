"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemStatus = exports.getPhase1Status = exports.healthCheck = exports.getHealth = exports.getStatus = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
exports.getStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
exports.getHealth = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
exports.healthCheck = exports.getHealth;
exports.getPhase1Status = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({
        success: true,
        phase: 'phase1',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});
exports.getSystemStatus = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({
        success: true,
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            environment: process.env.NODE_ENV || 'development'
        },
        timestamp: new Date().toISOString()
    });
});
//# sourceMappingURL=statusController.js.map