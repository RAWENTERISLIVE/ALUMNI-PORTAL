"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobStats = exports.searchJobs = exports.incrementApplicationCount = exports.toggleSaveJob = exports.getAppliedJobs = exports.getSavedJobs = exports.unsaveJob = exports.saveJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
const isAdminRole = (role) => {
    const normalized = (role || '').toLowerCase();
    return normalized === 'admin' || normalized === 'super_admin' || role === client_1.Role.ADMIN || role === client_1.Role.SUPER_ADMIN;
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
exports.getJobs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page, 10) || 1;
    const limit = Number.parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
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
    const orderBy = {};
    if (sortBy)
        orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
    const [jobs, total] = await Promise.all([
        prisma_1.default.job.findMany({
            where,
            orderBy: Object.keys(orderBy).length > 0 ? orderBy : { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                postedBy: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        profileImage: true
                    }
                }
            }
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
        include: {
            postedBy: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    profileImage: true
                }
            }
        }
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
        include: {
            postedBy: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    profileImage: true
                }
            }
        }
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
        include: {
            postedBy: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    profileImage: true
                }
            }
        }
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
    const jobs = await prisma_1.default.job.findMany({
        where: {
            savedBy: {
                some: {
                    id: req.user.id
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        include: {
            postedBy: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    profileImage: true
                }
            }
        }
    });
    res.status(200).json({ success: true, data: jobs.map(formatJob) });
});
exports.getAppliedJobs = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    res.status(200).json({ success: true, data: [] });
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
    const updated = await prisma_1.default.job.update({
        where: { id },
        data: {
            applicationCount: {
                increment: 1
            }
        }
    });
    res.status(200).json({
        success: true,
        message: 'Application recorded',
        data: { applicationCount: updated.applicationCount }
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
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { company: { contains: query, mode: 'insensitive' } },
                { location: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } }
            ]
        },
        orderBy: { createdAt: 'desc' },
        include: {
            postedBy: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    profileImage: true
                }
            }
        },
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