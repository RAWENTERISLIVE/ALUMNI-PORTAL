import { Response } from 'express';
import JobApplication from '../models/JobApplication';
import Job, { IJob } from '../models/Job';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

// @desc    Apply for a job
// @route   POST /api/jobs/:jobId/apply
// @access  Private
export const applyForJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const { coverLetter, resumeUrl } = req.body;
  const applicantId = req.user?.id;

  // Check if job exists and is active
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  if (!job.isActive) {
    return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
  }

  // Check if application deadline has passed
  if (job.applicationDeadline && new Date() > job.applicationDeadline) {
    return res.status(400).json({ success: false, message: 'Application deadline has passed' });
  }

  // Check if user has already applied
  const existingApplication = await JobApplication.findOne({
    job: jobId,
    applicant: applicantId
  });

  if (existingApplication) {
    return res.status(400).json({ success: false, message: 'You have already applied for this job' });
  }

  // Create application
  const application = await JobApplication.create({
    job: jobId,
    applicant: applicantId,
    coverLetter,
    resumeUrl
  });

  // Increment application count
  await Job.findByIdAndUpdate(jobId, {
    $inc: { applicationCount: 1 }
  });

  res.status(201).json({
    success: true,
    data: application,
    message: 'Application submitted successfully'
  });
});

// @desc    Get user's job applications
// @route   GET /api/jobs/applications/my
// @access  Private
export const getMyApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const applicantId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const applications = await JobApplication.find({ applicant: applicantId })
    .populate({
      path: 'job',
      select: 'title company location type isActive applicationDeadline'
    })
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await JobApplication.countDocuments({ applicant: applicantId });

  res.json({
    success: true,
    data: applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get applications for a specific job (Job poster only)
// @route   GET /api/jobs/:jobId/applications
// @access  Private
export const getJobApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { jobId } = req.params;
  const userId = req.user?.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Check if user posted this job
  const job = await Job.findById(jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  if (job.postedBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to view applications' });
  }

  const applications = await JobApplication.find({ job: jobId })
    .populate({
      path: 'applicant',
      select: 'name email profileImage firstName lastName admissionYear'
    })
    .sort({ appliedAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await JobApplication.countDocuments({ job: jobId });

  res.json({
    success: true,
    data: applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Update application status (Job poster only)
// @route   PATCH /api/jobs/applications/:applicationId
// @access  Private
export const updateApplicationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const { status, notes } = req.body;
  const userId = req.user?.id;

  const application = await JobApplication.findById(applicationId).populate('job');
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  // Check if user posted this job
  const job = application.job as unknown as IJob;
  if (job.postedBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
  }

  // Update application
  application.status = status;
  if (notes) application.notes = notes;
  application.reviewedAt = new Date();
  application.reviewedBy = new Types.ObjectId(userId);

  await application.save();

  res.json({
    success: true,
    data: application,
    message: 'Application status updated successfully'
  });
});

// @desc    Get application details
// @route   GET /api/jobs/applications/:applicationId
// @access  Private
export const getApplicationDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const userId = req.user?.id;

  const application = await JobApplication.findById(applicationId)
    .populate({
      path: 'job',
      select: 'title company location type postedBy'
    })
    .populate({
      path: 'applicant',
      select: 'name email profileImage firstName lastName admissionYear'
    })
    .populate({
      path: 'reviewedBy',
      select: 'name email'
    });

  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  const job = application.job as any;
  
  // Check if user is either the applicant or the job poster
  if (application.applicant._id.toString() !== userId && job.postedBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
  }

  res.json({
    success: true,
    data: application
  });
});

// @desc    Withdraw job application
// @route   DELETE /api/jobs/applications/:applicationId
// @access  Private
export const withdrawApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { applicationId } = req.params;
  const userId = req.user?.id;

  const application = await JobApplication.findById(applicationId);
  if (!application) {
    return res.status(404).json({ success: false, message: 'Application not found' });
  }

  // Check if user is the applicant
  if (application.applicant.toString() !== userId) {
    return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application' });
  }

  // Can only withdraw pending applications
  if (application.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Can only withdraw pending applications' });
  }

  // Delete application and decrement count
  await JobApplication.findByIdAndDelete(applicationId);
  await Job.findByIdAndUpdate(application.job, {
    $inc: { applicationCount: -1 }
  });

  res.json({
    success: true,
    message: 'Application withdrawn successfully'
  });
});

// @desc    Get application statistics
// @route   GET /api/jobs/applications/stats
// @access  Private
export const getApplicationStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  // Get user's application stats
  const applicationStats = await JobApplication.aggregate([
    { $match: { applicant: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get user's job post stats (if they posted any jobs)
  const jobStats = await Job.aggregate([
    { $match: { postedBy: new Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        totalApplications: { $sum: '$applicationCount' },
        activeJobs: {
          $sum: { $cond: ['$isActive', 1, 0] }
        }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      applications: applicationStats,
      jobsPosted: jobStats[0] || { totalJobs: 0, totalApplications: 0, activeJobs: 0 }
    }
  });
});
