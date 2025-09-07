"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportStats = exports.deleteReport = exports.updateReportStatus = exports.getAllReports = exports.createReport = void 0;
const Report_1 = __importDefault(require("../models/Report"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.createReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type, description, reason, reportedUser, reportedPost, reportedComment, reportedGroup, reportedJob } = req.body;
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
        return;
    }
    const report = new Report_1.default({
        type,
        description,
        reason,
        reportedBy: userId,
        ...(reportedUser && { reportedUser }),
        ...(reportedPost && { reportedPost }),
        ...(reportedComment && { reportedComment }),
        ...(reportedGroup && { reportedGroup }),
        ...(reportedJob && { reportedJob })
    });
    await report.save();
    res.status(201).json({
        success: true,
        message: 'Report submitted successfully',
        data: report
    });
});
exports.getAllReports = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const type = req.query.type;
    const query = {};
    if (status)
        query.status = status;
    if (type)
        query.type = type;
    const reports = await Report_1.default.find(query)
        .populate('reportedBy', 'name email')
        .populate('reportedUser', 'name email')
        .populate('reportedPost', 'title content')
        .populate('reportedComment', 'content')
        .populate('reportedGroup', 'name')
        .populate('reportedJob', 'title')
        .populate('reviewedBy', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
    const total = await Report_1.default.countDocuments(query);
    res.json({
        success: true,
        data: reports,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});
exports.updateReportStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const userId = req.user?.id || req.user?._id;
    const report = await Report_1.default.findById(reportId);
    if (!report) {
        res.status(404).json({
            success: false,
            message: 'Report not found'
        });
        return;
    }
    report.status = status;
    if (adminNotes)
        report.adminNotes = adminNotes;
    if (status !== 'pending' && userId) {
        report.reviewedBy = userId;
        report.reviewedAt = new Date();
    }
    await report.save();
    res.json({
        success: true,
        message: 'Report status updated successfully',
        data: report
    });
});
exports.deleteReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    const report = await Report_1.default.findByIdAndDelete(reportId);
    if (!report) {
        res.status(404).json({
            success: false,
            message: 'Report not found'
        });
        return;
    }
    res.json({
        success: true,
        message: 'Report deleted successfully'
    });
});
exports.getReportStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const stats = await Report_1.default.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    const typeStats = await Report_1.default.aggregate([
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 }
            }
        }
    ]);
    const totalReports = await Report_1.default.countDocuments();
    const pendingReports = await Report_1.default.countDocuments({ status: 'pending' });
    res.json({
        success: true,
        data: {
            total: totalReports,
            pending: pendingReports,
            statusStats: stats,
            typeStats: typeStats
        }
    });
});
//# sourceMappingURL=reportController.js.map