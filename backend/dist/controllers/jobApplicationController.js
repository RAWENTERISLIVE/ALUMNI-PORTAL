"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApplicationStats = exports.withdrawApplication = exports.getApplicationDetails = exports.updateApplicationStatus = exports.getJobApplications = exports.getMyApplications = exports.applyForJob = void 0;
const JobApplication_1 = __importDefault(require("../models/JobApplication"));
const Job_1 = __importDefault(require("../models/Job"));
const errorHandler_1 = require("../middleware/errorHandler");
const mongoose_1 = require("mongoose");
exports.applyForJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const { coverLetter, resumeUrl } = req.body;
    const applicantId = req.user?.id;
    const job = await Job_1.default.findById(jobId);
    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (!job.isActive) {
        return res.status(400).json({ success: false, message: 'This job is no longer accepting applications' });
    }
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
        return res.status(400).json({ success: false, message: 'Application deadline has passed' });
    }
    const existingApplication = await JobApplication_1.default.findOne({
        job: jobId,
        applicant: applicantId
    });
    if (existingApplication) {
        return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }
    const application = await JobApplication_1.default.create({
        job: jobId,
        applicant: applicantId,
        coverLetter,
        resumeUrl
    });
    await Job_1.default.findByIdAndUpdate(jobId, {
        $inc: { applicationCount: 1 }
    });
    res.status(201).json({
        success: true,
        data: application,
        message: 'Application submitted successfully'
    });
});
exports.getMyApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const applicantId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const applications = await JobApplication_1.default.find({ applicant: applicantId })
        .populate({
        path: 'job',
        select: 'title company location type isActive applicationDeadline'
    })
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await JobApplication_1.default.countDocuments({ applicant: applicantId });
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
exports.getJobApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const job = await Job_1.default.findById(jobId);
    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (job.postedBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to view applications' });
    }
    const applications = await JobApplication_1.default.find({ job: jobId })
        .populate({
        path: 'applicant',
        select: 'name email profileImage firstName lastName admissionYear'
    })
        .sort({ appliedAt: -1 })
        .skip(skip)
        .limit(limit);
    const total = await JobApplication_1.default.countDocuments({ job: jobId });
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
exports.updateApplicationStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;
    const application = await JobApplication_1.default.findById(applicationId).populate('job');
    if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
    }
    const job = application.job;
    if (job.postedBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this application' });
    }
    application.status = status;
    if (notes)
        application.notes = notes;
    application.reviewedAt = new Date();
    application.reviewedBy = new mongoose_1.Types.ObjectId(userId);
    await application.save();
    res.json({
        success: true,
        data: application,
        message: 'Application status updated successfully'
    });
});
exports.getApplicationDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    const application = await JobApplication_1.default.findById(applicationId)
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
    const job = application.job;
    if (application.applicant._id.toString() !== userId && job.postedBy.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this application' });
    }
    res.json({
        success: true,
        data: application
    });
});
exports.withdrawApplication = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { applicationId } = req.params;
    const userId = req.user?.id;
    const application = await JobApplication_1.default.findById(applicationId);
    if (!application) {
        return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.applicant.toString() !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized to withdraw this application' });
    }
    if (application.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Can only withdraw pending applications' });
    }
    await JobApplication_1.default.findByIdAndDelete(applicationId);
    await Job_1.default.findByIdAndUpdate(application.job, {
        $inc: { applicationCount: -1 }
    });
    res.json({
        success: true,
        message: 'Application withdrawn successfully'
    });
});
exports.getApplicationStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const applicationStats = await JobApplication_1.default.aggregate([
        { $match: { applicant: new mongoose_1.Types.ObjectId(userId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
    const jobStats = await Job_1.default.aggregate([
        { $match: { postedBy: new mongoose_1.Types.ObjectId(userId) } },
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
//# sourceMappingURL=jobApplicationController.js.map