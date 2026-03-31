"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobStats = exports.searchJobs = exports.getJobApplications = exports.incrementApplicationCount = exports.toggleSaveJob = exports.getAppliedJobs = exports.getSavedJobs = exports.unsaveJob = exports.saveJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const isAdminRole = (role) => {
    const normalized = (role || '').toLowerCase();
    return normalized === 'moderator' || normalized === 'admin' || normalized === 'super_admin' || String(role) === 'MODERATOR' || role === client_1.Role.ADMIN || role === client_1.Role.SUPER_ADMIN;
};
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const SORTABLE_JOB_FIELDS = new Set(['createdAt', 'applicationDeadline', 'applicationCount', 'title', 'company']);
const parsePositiveInt = (value, fallback) => {
    if (typeof value !== 'string' && typeof value !== 'number') {
        return fallback;
    }
    const parsed = Number.parseInt(`${value}`, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const parsePagination = (pageInput, limitInput, fallbackLimit = DEFAULT_PAGE_SIZE) => {
    const page = parsePositiveInt(pageInput, 1);
    const limit = Math.min(parsePositiveInt(limitInput, fallbackLimit), MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};
const jobInclude = {
    postedBy: {
        select: {
            id: true,
            name: true,
            profileImage: true
        }
    }
};
const formatJob = (job) => ({
    ...job,
    salaryRange: job.salaryRangeMin !== null && job.salaryRangeMin !== undefined &&
        job.salaryRangeMax !== null && job.salaryRangeMax !== undefined
        ? {
            min: job.salaryRangeMin,
            max: job.salaryRangeMax,
            currency: job.salaryCurrency || 'USD'
        }
        : undefined,
    postedDate: job.createdAt,
    applicants: []
});
const safeTrim = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
const isHttpUrl = (value) => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    }
    catch {
        return false;
    }
};
const isValidResumeUrl = (value) => {
    if (value.startsWith('/api/uploads/')) {
        return true;
    }
    return isHttpUrl(value);
};
const readMetadataString = (metadata, key) => {
    const value = metadata[key];
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
exports.getJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit);
    const { type, location, company, isActive = 'true', postedBy, tags, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const where = {};
    if (isActive !== 'all')
        where.isActive = isActive === 'true';
    if (type)
        where.type = type;
    if (location)
        where.location = { contains: location, mode: 'insensitive' };
    if (company)
        where.company = { contains: company, mode: 'insensitive' };
    if (postedBy)
        where.postedById = postedBy;
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        where.tags = { hasSome: tagArray };
    }
    const requestedSortBy = typeof sortBy === 'string' ? sortBy : 'createdAt';
    const resolvedSortBy = SORTABLE_JOB_FIELDS.has(requestedSortBy) ? requestedSortBy : 'createdAt';
    const resolvedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    const [jobs, total] = await Promise.all([
        prisma_1.default.job.findMany({
            where,
            orderBy: { [resolvedSortBy]: resolvedSortOrder },
            skip,
            take: limit,
            include: jobInclude
        }),
        prisma_1.default.job.count({ where })
    ]);
    const formattedJobs = jobs.map(formatJob);
    res.status(200).json({
        success: true,
        data: formattedJobs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getJobById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({
        where: { id },
        include: jobInclude
    });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    res.status(200).json({ success: true, data: formatJob(job) });
});
exports.createJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { title, company, location, type, salaryRange, description, requirements, benefits, applicationUrl, contactEmail, isAlumniReferral, applicationDeadline, tags } = req.body;
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!title || !company || !location || !type || !description) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
    }
    const postingUser = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
    });
    const jobData = {
        title, company, location, type, description,
        requirements: requirements || [], benefits: benefits || [],
        postedById: req.user.id,
        postedByName: postingUser?.name || req.user.name || req.user.email,
        isAlumniReferral: isAlumniReferral ?? true,
        tags: tags || []
    };
    if (salaryRange?.min !== undefined && salaryRange?.max !== undefined) {
        jobData.salaryRangeMin = Number(salaryRange.min);
        jobData.salaryRangeMax = Number(salaryRange.max);
        jobData.salaryCurrency = salaryRange.currency || 'USD';
    }
    if (applicationUrl)
        jobData.applicationUrl = applicationUrl;
    if (contactEmail)
        jobData.contactEmail = contactEmail;
    if (applicationDeadline)
        jobData.applicationDeadline = new Date(applicationDeadline);
    const job = await prisma_1.default.job.create({
        data: jobData,
        include: jobInclude
    });
    res.status(201).json({ success: true, data: formatJob(job) });
});
exports.updateJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const updateData = { ...req.body };
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    if (job.postedById !== req.user.id && !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const allowedUpdates = new Set([
        'title', 'company', 'location', 'type', 'salaryRange', 'description',
        'requirements', 'benefits', 'applicationUrl', 'contactEmail',
        'isActive', 'applicationDeadline', 'tags'
    ]);
    const dataToUpdate = {};
    for (const key of Object.keys(updateData)) {
        if (allowedUpdates.has(key)) {
            if (key === 'salaryRange' && updateData[key]) {
                dataToUpdate.salaryRangeMin = Number(updateData[key].min);
                dataToUpdate.salaryRangeMax = Number(updateData[key].max);
                dataToUpdate.salaryCurrency = updateData[key].currency || 'USD';
            }
            else if (key === 'applicationDeadline' && updateData[key]) {
                dataToUpdate.applicationDeadline = new Date(updateData[key]);
            }
            else {
                dataToUpdate[key] = updateData[key];
            }
        }
    }
    const updatedJob = await prisma_1.default.job.update({
        where: { id },
        data: dataToUpdate,
        include: jobInclude
    });
    res.status(200).json({ success: true, data: formatJob(updatedJob) });
});
exports.deleteJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    if (job.postedById !== req.user.id && !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    await prisma_1.default.job.delete({ where: { id } });
    res.status(200).json({ success: true, data: {} });
});
exports.saveJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    await prisma_1.default.job.update({
        where: { id },
        data: {
            savedBy: {
                connect: { id: req.user.id }
            }
        }
    });
    res.status(200).json({ success: true, message: 'Job saved' });
});
exports.unsaveJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    await prisma_1.default.job.update({
        where: { id },
        data: {
            savedBy: {
                disconnect: { id: req.user.id }
            }
        }
    });
    res.status(200).json({ success: true, message: 'Job unsaved' });
});
exports.getSavedJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20);
    const jobs = await prisma_1.default.job.findMany({
        where: {
            savedBy: {
                some: {
                    id: req.user.id
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: jobInclude
    });
    const total = await prisma_1.default.job.count({
        where: {
            savedBy: {
                some: {
                    id: req.user.id
                }
            }
        }
    });
    res.status(200).json({
        success: true,
        data: jobs.map(formatJob),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getAppliedJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { page, limit, skip } = parsePagination(req.query.page, req.query.limit, 20);
    const where = {
        userId: req.user.id,
        type: 'job_application_submitted'
    };
    const [applicationNotifications, total] = await Promise.all([
        prisma_1.default.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            select: {
                metadata: true,
                createdAt: true
            }
        }),
        prisma_1.default.notification.count({ where })
    ]);
    const jobIds = applicationNotifications
        .map((notification) => {
        const metadata = notification.metadata;
        return metadata?.jobId;
    })
        .filter((jobId) => Boolean(jobId));
    if (jobIds.length === 0) {
        res.status(200).json({
            success: true,
            data: [],
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
        return;
    }
    const uniqueJobIds = Array.from(new Set(jobIds));
    const jobs = await prisma_1.default.job.findMany({
        where: { id: { in: uniqueJobIds } },
        include: jobInclude
    });
    const jobsById = new Map(jobs.map((job) => [job.id, job]));
    const orderedJobs = uniqueJobIds
        .map((jobId) => jobsById.get(jobId))
        .filter((job) => Boolean(job));
    res.status(200).json({
        success: true,
        data: orderedJobs.map(formatJob),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.toggleSaveJob = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    const savedJob = await prisma_1.default.job.findFirst({
        where: {
            id,
            savedBy: {
                some: {
                    id: req.user.id
                }
            }
        },
        select: { id: true }
    });
    if (savedJob) {
        await prisma_1.default.job.update({
            where: { id },
            data: {
                savedBy: {
                    disconnect: { id: req.user.id }
                }
            }
        });
        res.status(200).json({ success: true, message: 'Job unsaved', data: { saved: false } });
        return;
    }
    await prisma_1.default.job.update({
        where: { id },
        data: {
            savedBy: {
                connect: { id: req.user.id }
            }
        }
    });
    res.status(200).json({ success: true, message: 'Job saved', data: { saved: true } });
});
exports.incrementApplicationCount = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const rawBody = req.body || {};
    const coverLetter = safeTrim(rawBody.coverLetter);
    const resumeUrl = safeTrim(rawBody.resumeUrl);
    const resumeFilename = safeTrim(rawBody.resumeFilename);
    const portfolioUrl = safeTrim(rawBody.portfolioUrl);
    const job = await prisma_1.default.job.findUnique({ where: { id } });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    if (job.postedById === req.user.id) {
        res.status(400).json({ success: false, message: 'You cannot apply to your own job posting' });
        return;
    }
    if (coverLetter && coverLetter.length > 4000) {
        res.status(400).json({ success: false, message: 'Cover letter must be 4000 characters or fewer' });
        return;
    }
    if (portfolioUrl && !isHttpUrl(portfolioUrl)) {
        res.status(400).json({ success: false, message: 'Portfolio URL must be a valid http(s) URL' });
        return;
    }
    if (resumeUrl && !isValidResumeUrl(resumeUrl)) {
        res.status(400).json({ success: false, message: 'Resume URL is invalid' });
        return;
    }
    if (resumeFilename && !resumeUrl) {
        res.status(400).json({ success: false, message: 'Resume filename requires a resume URL' });
        return;
    }
    const existingApplication = await prisma_1.default.notification.findFirst({
        where: {
            userId: req.user.id,
            type: 'job_application_submitted',
            metadata: {
                path: ['jobId'],
                equals: id
            }
        },
        select: { id: true }
    });
    if (existingApplication) {
        res.status(200).json({
            success: true,
            message: 'You have already applied to this job',
            data: {
                alreadyApplied: true,
                applicationCount: job.applicationCount
            }
        });
        return;
    }
    const appliedAt = new Date().toISOString();
    const applicantMetadata = {
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        coverLetter,
        resumeUrl,
        resumeFilename,
        portfolioUrl,
        appliedAt
    };
    const [updated] = await prisma_1.default.$transaction([
        prisma_1.default.job.update({
            where: { id },
            data: {
                applicationCount: {
                    increment: 1
                }
            }
        }),
        prisma_1.default.notification.create({
            data: {
                userId: req.user.id,
                title: `Application submitted: ${job.title}`,
                message: `You successfully applied to ${job.title} at ${job.company}.`,
                type: 'job_application_submitted',
                actionUrl: `/jobs`,
                metadata: applicantMetadata
            }
        })
    ]);
    if (job.postedById !== req.user.id) {
        await prisma_1.default.notification.create({
            data: {
                userId: job.postedById,
                title: `New applicant for ${job.title}`,
                message: `${req.user.name || req.user.email} applied for your job posting.`,
                type: 'job_application_received',
                actionUrl: `/jobs`,
                metadata: {
                    jobId: job.id,
                    jobTitle: job.title,
                    applicantId: req.user.id,
                    applicantName: req.user.name || req.user.email,
                    applicantEmail: req.user.email,
                    coverLetter,
                    resumeUrl,
                    resumeFilename,
                    portfolioUrl,
                    appliedAt
                }
            }
        });
    }
    res.status(200).json({
        success: true,
        message: 'Application submitted successfully',
        data: {
            alreadyApplied: false,
            applicationCount: updated.applicationCount
        }
    });
});
exports.getJobApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ success: false, message: 'Job ID is required' });
        return;
    }
    const job = await prisma_1.default.job.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            postedById: true
        }
    });
    if (!job) {
        res.status(404).json({ success: false, message: 'Job not found' });
        return;
    }
    if (job.postedById !== req.user.id && !isAdminRole(req.user.role)) {
        res.status(403).json({ success: false, message: 'Not authorized to view job applications' });
        return;
    }
    const applicationNotifications = await prisma_1.default.notification.findMany({
        where: {
            userId: job.postedById,
            type: 'job_application_received',
            metadata: {
                path: ['jobId'],
                equals: id
            }
        },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            createdAt: true,
            metadata: true
        }
    });
    const applications = applicationNotifications.map((notification) => {
        const metadata = notification.metadata && typeof notification.metadata === 'object' && !Array.isArray(notification.metadata)
            ? notification.metadata
            : {};
        return {
            id: notification.id,
            applicantId: readMetadataString(metadata, 'applicantId') || '',
            applicantName: readMetadataString(metadata, 'applicantName') || 'Unknown applicant',
            applicantEmail: readMetadataString(metadata, 'applicantEmail') || '',
            coverLetter: readMetadataString(metadata, 'coverLetter') || '',
            resumeUrl: readMetadataString(metadata, 'resumeUrl') || '',
            resumeFilename: readMetadataString(metadata, 'resumeFilename') || '',
            portfolioUrl: readMetadataString(metadata, 'portfolioUrl') || '',
            appliedAt: readMetadataString(metadata, 'appliedAt') || notification.createdAt.toISOString()
        };
    });
    res.status(200).json({
        success: true,
        data: applications,
        meta: {
            jobId: job.id,
            jobTitle: job.title,
            total: applications.length
        }
    });
});
exports.searchJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const rawQuery = req.query.query;
    const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
    if (!query) {
        res.status(200).json({ success: true, data: [] });
        return;
    }
    const jobs = await prisma_1.default.job.findMany({
        where: {
            isActive: true,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: jobInclude,
        take: 20
    });
    res.status(200).json({ success: true, data: jobs.map(formatJob) });
});
exports.getJobStats = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const totalJobs = await prisma_1.default.job.count();
    const activeJobs = await prisma_1.default.job.count({ where: { isActive: true } });
    const applications = await prisma_1.default.job.aggregate({ _sum: { applicationCount: true } });
    res.status(200).json({
        success: true,
        data: {
            totalJobs,
            activeJobs,
            totalApplications: applications._sum.applicationCount || 0
        }
    });
});
//# sourceMappingURL=jobController.js.map