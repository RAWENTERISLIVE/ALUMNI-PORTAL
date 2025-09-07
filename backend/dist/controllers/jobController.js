"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobStats = exports.incrementApplicationCount = exports.getSavedJobs = exports.toggleSaveJob = exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const Job_1 = __importDefault(require("../models/Job"));
const mongoose_1 = __importDefault(require("mongoose"));
const getJobs = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type, location, company, isActive = 'true', postedBy, tags, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (isActive !== 'all') {
            filter.isActive = isActive === 'true';
        }
        if (type) {
            filter.type = type;
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' };
        }
        if (company) {
            filter.company = { $regex: company, $options: 'i' };
        }
        if (postedBy) {
            filter.postedBy = postedBy;
        }
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }
        const sortField = sortBy;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        const sort = { [sortField]: sortDirection };
        const jobs = await Job_1.default.find(filter)
            .populate('postedBy', 'name email profileImage')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        const total = await Job_1.default.countDocuments(filter);
        const formattedJobs = jobs.map(job => ({
            ...job,
            id: job._id.toString(),
            postedBy: job.postedBy ? {
                ...job.postedBy,
                id: job.postedBy._id ? job.postedBy._id.toString() : undefined
            } : job.postedBy
        }));
        res.status(200).json({
            success: true,
            data: formattedJobs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobs = getJobs;
const getJobById = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
            return;
        }
        const job = await Job_1.default.findById(id).populate('postedBy', 'name email profileImage');
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: job
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobById = getJobById;
const createJob = async (req, res, next) => {
    try {
        const { title, company, location, type, salaryRange, description, requirements, benefits, applicationUrl, contactEmail, isAlumniReferral, applicationDeadline, tags } = req.body;
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        if (!title || !company || !location || !type || !description) {
            res.status(400).json({
                success: false,
                message: 'Missing required fields: title, company, location, type, description'
            });
            return;
        }
        const jobData = {
            title,
            company,
            location,
            type,
            description,
            requirements: requirements || [],
            benefits: benefits || [],
            postedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            postedByName: req.user.name,
            isAlumniReferral: isAlumniReferral !== undefined ? isAlumniReferral : true,
            tags: tags || []
        };
        if (salaryRange && salaryRange.min !== undefined && salaryRange.max !== undefined) {
            jobData.salaryRange = {
                min: salaryRange.min,
                max: salaryRange.max,
                currency: salaryRange.currency || 'USD'
            };
        }
        if (applicationUrl) {
            jobData.applicationUrl = applicationUrl;
        }
        if (contactEmail) {
            jobData.contactEmail = contactEmail;
        }
        if (applicationDeadline) {
            jobData.applicationDeadline = new Date(applicationDeadline);
        }
        const job = new Job_1.default(jobData);
        await job.save();
        const populatedJob = await Job_1.default.findById(job._id).populate('postedBy', 'name email profileImage');
        res.status(201).json({
            success: true,
            message: 'Job created successfully',
            data: populatedJob
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createJob = createJob;
const updateJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to update this job'
            });
            return;
        }
        const { title, company, location, type, salaryRange, description, requirements, benefits, applicationUrl, contactEmail, isAlumniReferral, applicationDeadline, isActive, tags } = req.body;
        if (title !== undefined)
            job.title = title;
        if (company !== undefined)
            job.company = company;
        if (location !== undefined)
            job.location = location;
        if (type !== undefined)
            job.type = type;
        if (description !== undefined)
            job.description = description;
        if (requirements !== undefined)
            job.requirements = requirements;
        if (benefits !== undefined)
            job.benefits = benefits;
        if (applicationUrl !== undefined)
            job.applicationUrl = applicationUrl;
        if (contactEmail !== undefined)
            job.contactEmail = contactEmail;
        if (isAlumniReferral !== undefined)
            job.isAlumniReferral = isAlumniReferral;
        if (tags !== undefined)
            job.tags = tags;
        if (salaryRange !== undefined) {
            if (salaryRange === null) {
                job.salaryRange = undefined;
            }
            else {
                job.salaryRange = {
                    min: salaryRange.min,
                    max: salaryRange.max,
                    currency: salaryRange.currency || 'USD'
                };
            }
        }
        if (applicationDeadline !== undefined) {
            if (applicationDeadline === null) {
                job.applicationDeadline = undefined;
            }
            else {
                job.applicationDeadline = new Date(applicationDeadline);
            }
        }
        if (isActive !== undefined) {
            job.isActive = isActive;
        }
        await job.save();
        const updatedJob = await Job_1.default.findById(job._id).populate('postedBy', 'name email profileImage');
        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            data: updatedJob
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateJob = updateJob;
const deleteJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job'
            });
            return;
        }
        await Job_1.default.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: 'Job deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteJob = deleteJob;
const toggleSaveJob = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
            return;
        }
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        const userId = new mongoose_1.default.Types.ObjectId(req.user.id);
        const isSaved = job.savedBy.includes(userId);
        if (isSaved) {
            job.savedBy = job.savedBy.filter(id => !id.equals(userId));
        }
        else {
            job.savedBy.push(userId);
        }
        await job.save();
        res.status(200).json({
            success: true,
            message: isSaved ? 'Job unsaved successfully' : 'Job saved successfully',
            data: {
                isSaved: !isSaved,
                savedCount: job.savedBy.length
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.toggleSaveJob = toggleSaveJob;
const getSavedJobs = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
            return;
        }
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const sortField = sortBy;
        const sortDirection = sortOrder === 'desc' ? -1 : 1;
        const sort = { [sortField]: sortDirection };
        const jobs = await Job_1.default.find({
            savedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            isActive: true
        })
            .populate('postedBy', 'name email profileImage')
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .lean();
        const total = await Job_1.default.countDocuments({
            savedBy: new mongoose_1.default.Types.ObjectId(req.user.id),
            isActive: true
        });
        res.status(200).json({
            success: true,
            data: {
                jobs,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    pages: Math.ceil(total / limitNum)
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getSavedJobs = getSavedJobs;
const incrementApplicationCount = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                success: false,
                message: 'Invalid job ID'
            });
            return;
        }
        const job = await Job_1.default.findById(id);
        if (!job) {
            res.status(404).json({
                success: false,
                message: 'Job not found'
            });
            return;
        }
        if (!job.isActive) {
            res.status(400).json({
                success: false,
                message: 'Cannot apply to inactive job'
            });
            return;
        }
        job.applicationCount += 1;
        await job.save();
        res.status(200).json({
            success: true,
            message: 'Application count updated',
            data: {
                applicationCount: job.applicationCount
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.incrementApplicationCount = incrementApplicationCount;
const getJobStats = async (req, res, next) => {
    try {
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
            return;
        }
        const totalJobs = await Job_1.default.countDocuments();
        const activeJobs = await Job_1.default.countDocuments({ isActive: true });
        const inactiveJobs = await Job_1.default.countDocuments({ isActive: false });
        const jobsByType = await Job_1.default.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);
        const totalApplications = await Job_1.default.aggregate([
            { $group: { _id: null, total: { $sum: '$applicationCount' } } }
        ]);
        const recentJobs = await Job_1.default.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('postedBy', 'name email')
            .lean();
        res.status(200).json({
            success: true,
            data: {
                totalJobs,
                activeJobs,
                inactiveJobs,
                totalApplications: totalApplications[0]?.total || 0,
                jobsByType,
                recentJobs
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getJobStats = getJobStats;
//# sourceMappingURL=jobController.js.map