import { Request, Response } from 'express';
import Report from '../models/Report';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: {
    id: string;
    _id: string;
    role: string;
  };
}

// Create a new report
export const createReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, description, reason, reportedUser, reportedPost, reportedComment, reportedGroup, reportedJob } = req.body;
  const userId = req.user?.id || req.user?._id;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const report = new Report({
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

// Get all reports (Admin only)
export const getAllReports = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const type = req.query.type as string;

  const query: any = {};
  if (status) query.status = status;
  if (type) query.type = type;

  const reports = await Report.find(query)
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

  const total = await Report.countDocuments(query);

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

// Update report status (Admin only)
export const updateReportStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { reportId } = req.params;
  const { status, adminNotes } = req.body;
  const userId = req.user?.id || req.user?._id;

  const report = await Report.findById(reportId);
  if (!report) {
    res.status(404).json({
      success: false,
      message: 'Report not found'
    });
    return;
  }

  report.status = status;
  if (adminNotes) report.adminNotes = adminNotes;
  if (status !== 'pending' && userId) {
    report.reviewedBy = userId as any;
    report.reviewedAt = new Date();
  }

  await report.save();

  res.json({
    success: true,
    message: 'Report status updated successfully',
    data: report
  });
});

// Delete report (Admin only)
export const deleteReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { reportId } = req.params;

  const report = await Report.findByIdAndDelete(reportId);
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

// Get report statistics (Admin only)
export const getReportStats = asyncHandler(async (_req: AuthRequest, res: Response): Promise<void> => {
  const stats = await Report.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const typeStats = await Report.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalReports = await Report.countDocuments();
  const pendingReports = await Report.countDocuments({ status: 'pending' });

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
