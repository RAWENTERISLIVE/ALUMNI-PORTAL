"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const commentController_1 = require("../controllers/commentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const commentValidationRules = [
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment content is required and must not exceed 1000 characters')
];
router.post('/posts/:postId/comments', auth_1.authMiddleware, commentValidationRules, validation_1.validate, commentController_1.createComment);
router.get('/posts/:postId/comments', commentController_1.getPostComments);
router.get('/comments/:commentId/replies', commentController_1.getCommentReplies);
router.post('/comments/:commentId/like', auth_1.authMiddleware, commentController_1.likeComment);
router.delete('/comments/:commentId/like', auth_1.authMiddleware, commentController_1.unlikeComment);
router.delete('/comments/:commentId', auth_1.authMiddleware, commentController_1.deleteComment);
exports.default = router;
//# sourceMappingURL=comments.js.map