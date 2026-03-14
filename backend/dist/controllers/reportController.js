"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportStats = exports.deleteReport = exports.updateReportStatus = exports.resolveReport = exports.getAllReports = exports.getReports = exports.createReport = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
exports.createReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    const report = await prisma_1.default.report.create({
        data: { ...req.body, reportedById: req.user.id }
    });
    res.status(201).json({ success: true, data: report });
});
exports.getReports = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const reports = await prisma_1.default.report.findMany({ include: { reportedBy: true, reportedUser: true }, take: 100 });
    res.status(200).json({ success: true, data: reports });
});
exports.getAllReports = exports.getReports;
exports.resolveReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const updated = await prisma_1.default.report.update({ where: { id: req.params.id }, data: { status: 'RESOLVED', reviewedById: req.user?.id } });
    res.status(200).json({ success: true, data: updated });
});
exports.updateReportStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    const { status, adminNotes } = req.body;
    const updated = await prisma_1.default.report.update({
        where: { id: reportId },
        data: {
            status: String(status || '').toUpperCase(),
            reviewedById: req.user?.id,
            adminNotes: adminNotes || null
        }
    });
    res.status(200).json({ success: true, data: updated });
});
exports.deleteReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reportId } = req.params;
    await prisma_1.default.report.delete({ where: { id: reportId } });
    res.status(200).json({ success: true, message: 'Report deleted' });
});
exports.getReportStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const [pending, reviewed, resolved, dismissed, total] = await Promise.all([
        prisma_1.default.report.count({ where: { status: 'PENDING' } }),
        prisma_1.default.report.count({ where: { status: 'REVIEWED' } }),
        prisma_1.default.report.count({ where: { status: 'RESOLVED' } }),
        prisma_1.default.report.count({ where: { status: 'DISMISSED' } }),
        prisma_1.default.report.count()
    ]);
    res.status(200).json({
        success: true,
        data: { total, pending, reviewed, resolved, dismissed }
    });
});
//# sourceMappingURL=reportController.js.map