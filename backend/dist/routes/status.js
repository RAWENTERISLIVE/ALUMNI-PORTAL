"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const statusController_1 = require("../controllers/statusController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.get('/health', statusController_1.healthCheck);
router.get('/phase1', auth_1.authMiddleware, auth_1.requireAdmin, statusController_1.getPhase1Status);
router.get('/system', auth_1.authMiddleware, auth_1.requireAdmin, statusController_1.getSystemStatus);
exports.default = router;
//# sourceMappingURL=status.js.map