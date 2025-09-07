"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const connectionController_1 = require("../controllers/connectionController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const sendRequestValidation = [
    (0, express_validator_1.body)('userId').isMongoId().withMessage('Valid user ID is required'),
    (0, express_validator_1.body)('message')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Message must not exceed 500 characters')
        .trim()
];
router.get('/', auth_1.authMiddleware, connectionController_1.getUserConnections);
router.get('/requests/received', auth_1.authMiddleware, connectionController_1.getReceivedConnectionRequests);
router.get('/requests/sent', auth_1.authMiddleware, connectionController_1.getSentConnectionRequests);
router.get('/:userId/status', auth_1.authMiddleware, connectionController_1.getConnectionStatus);
router.post('/request', auth_1.authMiddleware, sendRequestValidation, validation_1.validate, connectionController_1.sendConnectionRequest);
router.patch('/accept/:requestId', auth_1.authMiddleware, connectionController_1.acceptConnectionRequest);
router.patch('/reject/:requestId', auth_1.authMiddleware, connectionController_1.rejectConnectionRequest);
router.delete('/:connectionId', auth_1.authMiddleware, connectionController_1.removeConnection);
exports.default = router;
//# sourceMappingURL=connections.js.map