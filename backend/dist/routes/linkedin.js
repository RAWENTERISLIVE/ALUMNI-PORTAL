"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const linkedinController_1 = require("../controllers/linkedinController");
const router = express_1.default.Router();
router.get('/oauth-url', auth_1.authMiddleware, linkedinController_1.getLinkedInOAuthUrl);
router.get('/oauth-status', auth_1.authMiddleware, linkedinController_1.getLinkedInOAuthStatus);
router.get('/callback-script.js', linkedinController_1.getLinkedInCallbackScript);
router.get('/callback', linkedinController_1.handleLinkedInOAuthCallback);
exports.default = router;
//# sourceMappingURL=linkedin.js.map