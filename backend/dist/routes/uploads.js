"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const uploadController_1 = require("../controllers/uploadController");
const router = (0, express_1.Router)();
router.post('/single', auth_1.authMiddleware, uploadController_1.upload.single('file'), uploadController_1.uploadFile);
router.post('/multiple', auth_1.authMiddleware, uploadController_1.upload.array('files', 10), uploadController_1.uploadMultipleFiles);
router.get('/:filename', uploadController_1.serveFile);
exports.default = router;
//# sourceMappingURL=uploads.js.map