import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: { id: string };
}

export const createReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const {
    type,
    description,
    reason,
    reportedUserId,
    reportedPostId,
    reportedCommentId,
    reportedGroupId,
    reportedJobId
  } = req.body || {};

  // Strictly whitelist user-modifiable fields to prevent mass assignment of administrative fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reportData: any = {
    type: typeof type === 'string' ? type.trim() : '',
    description: typeof description === 'string' ? description.trim() : '',
    reason: typeof reason === 'string' ? reason.trim() : '',
    reportedById: req.user.id
  };

  if (typeof reportedUserId === 'string' && reportedUserId) reportData.reportedUserId = reportedUserId;
  if (typeof reportedPostId === 'string' && reportedPostId) reportData.reportedPostId = reportedPostId;
  if (typeof reportedCommentId === 'string' && reportedCommentId) reportData.reportedCommentId = reportedCommentId;
  if (typeof reportedGroupId === 'string' && reportedGroupId) reportData.reportedGroupId = reportedGroupId;
  if (typeof reportedJobId === 'string' && reportedJobId) reportData.reportedJobId = reportedJobId;

  const report = await prisma.report.create({
    data: reportData
  });
  res.status(201).json({ success: true, data: report });
});

export const getReports = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reports = await prisma.report.findMany({ include: { reportedBy: true, reportedUser: true }, take: 100 });
  res.status(200).json({ success: true, data: reports });
});

export const getAllReports = getReports;

export const resolveReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const reportId = String(req.params.id || '');
  const updated = await prisma.report.update({ where: { id: reportId }, data: { status: 'RESOLVED', reviewedById: req.user?.id } });
  res.status(200).json({ success: true, data: updated });
});

export const updateReportStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const reportId = String(req.params.reportId || '');
  const { status, adminNotes } = req.body;

  const updated = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: String(status || '').toUpperCase(),
      reviewedById: req.user?.id,
      adminNotes: adminNotes || null
    }
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reportId = String(req.params.reportId || '');
  await prisma.report.delete({ where: { id: reportId } });
  res.status(200).json({ success: true, message: 'Report deleted' });
});

export const getReportStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const [pending, reviewed, resolved, dismissed, total] = await Promise.all([
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'REVIEWED' } }),
    prisma.report.count({ where: { status: 'RESOLVED' } }),
    prisma.report.count({ where: { status: 'DISMISSED' } }),
    prisma.report.count()
  ]);

  res.status(200).json({
    success: true,
    data: { total, pending, reviewed, resolved, dismissed }
  });
});
