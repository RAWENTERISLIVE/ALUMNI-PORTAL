"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveFile = exports.uploadMultipleFiles = exports.uploadFile = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("../middleware/errorHandler");
const File_1 = __importDefault(require("../models/File"));
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path_1.default.extname(file.originalname);
        const basename = path_1.default.basename(file.originalname, extension);
        cb(null, `${basename}-${uniqueSuffix}${extension}`);
    }
});
const fileFilter = (_req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Unsupported file type'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024,
    }
});
exports.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
        return;
    }
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }
    const fileUrl = `/api/uploads/${req.file.filename}`;
    const fileRecord = new File_1.default({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        url: fileUrl,
        uploadedBy: req.user._id || req.user.id
    });
    await fileRecord.save();
    res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
            id: fileRecord._id,
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        }
    });
});
exports.uploadMultipleFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400).json({
            success: false,
            message: 'No files uploaded'
        });
        return;
    }
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }
    const uploadedFiles = [];
    for (const file of files) {
        const fileUrl = `/api/uploads/${file.filename}`;
        const fileRecord = new File_1.default({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            url: fileUrl,
            uploadedBy: req.user._id || req.user.id
        });
        await fileRecord.save();
        uploadedFiles.push({
            id: fileRecord._id,
            url: fileUrl,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype
        });
    }
    res.json({
        success: true,
        message: 'Files uploaded successfully',
        data: uploadedFiles
    });
});
exports.serveFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    if (!filename) {
        res.status(400).json({
            success: false,
            message: 'Filename is required'
        });
        return;
    }
    const filePath = path_1.default.join(__dirname, '../../uploads', filename);
    if (!fs_1.default.existsSync(filePath)) {
        res.status(404).json({
            success: false,
            message: 'File not found'
        });
        return;
    }
    res.sendFile(filePath);
});
//# sourceMappingURL=uploadController.js.map