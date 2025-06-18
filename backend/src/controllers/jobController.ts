import { Request, Response, NextFunction } from 'express';
import Job, { IJob } from '../models/Job';
import mongoose from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name: string;
  };
}

// Get all jobs
export const getJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      location,
      company,
      isActive = 'true',
      postedBy,
      tags,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    const filter: any = {};
    
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
      const tagArray = (tags as string).split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Build sort object
    const sortField = sortBy as string;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: sortDirection };

    const jobs = await Job.find(filter)
      .populate('postedBy', 'name email profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Job.countDocuments(filter);

    // Format jobs to ensure consistent id field
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
  } catch (error) {
    next(error);
  }
};

// Get job by ID
export const getJobById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
      return;
    }

    const job = await Job.findById(id).populate('postedBy', 'name email profileImage');

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
  } catch (error) {
    next(error);
  }
};

// Create new job
export const createJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      company,
      location,
      type,
      salaryRange,
      description,
      requirements,
      benefits,
      applicationUrl,
      contactEmail,
      isAlumniReferral,
      applicationDeadline,
      tags
    } = req.body;

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Validate required fields
    if (!title || !company || !location || !type || !description) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, company, location, type, description'
      });
      return;
    }

    const jobData: Partial<IJob> = {
      title,
      company,
      location,
      type,
      description,
      requirements: requirements || [],
      benefits: benefits || [],
      postedBy: new mongoose.Types.ObjectId(req.user.id),
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

    const job = new Job(jobData);
    await job.save();

    const populatedJob = await Job.findById(job._id).populate('postedBy', 'name email profileImage');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: populatedJob
    });
  } catch (error) {
    next(error);
  }
};

// Update job
export const updateJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

    const job = await Job.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    // Check if user owns the job or is admin/super_admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
      return;
    }

    const {
      title,
      company,
      location,
      type,
      salaryRange,
      description,
      requirements,
      benefits,
      applicationUrl,
      contactEmail,
      isAlumniReferral,
      applicationDeadline,
      isActive,
      tags
    } = req.body;

    // Update fields
    if (title !== undefined) job.title = title;
    if (company !== undefined) job.company = company;
    if (location !== undefined) job.location = location;
    if (type !== undefined) job.type = type;
    if (description !== undefined) job.description = description;
    if (requirements !== undefined) job.requirements = requirements;
    if (benefits !== undefined) job.benefits = benefits;
    if (applicationUrl !== undefined) job.applicationUrl = applicationUrl;
    if (contactEmail !== undefined) job.contactEmail = contactEmail;
    if (isAlumniReferral !== undefined) job.isAlumniReferral = isAlumniReferral;
    if (tags !== undefined) job.tags = tags;

    if (salaryRange !== undefined) {
      if (salaryRange === null) {
        (job as any).salaryRange = undefined;
      } else {
        job.salaryRange = {
          min: salaryRange.min,
          max: salaryRange.max,
          currency: salaryRange.currency || 'USD'
        };
      }
    }

    if (applicationDeadline !== undefined) {
      if (applicationDeadline === null) {
        (job as any).applicationDeadline = undefined;
      } else {
        job.applicationDeadline = new Date(applicationDeadline);
      }
    }

    if (isActive !== undefined) {
      job.isActive = isActive;
    }

    await job.save();

    const updatedJob = await Job.findById(job._id).populate('postedBy', 'name email profileImage');

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob
    });
  } catch (error) {
    next(error);
  }
};

// Delete job
export const deleteJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

    const job = await Job.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    // Check if user owns the job or is admin/super_admin
    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
      return;
    }

    await Job.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Save/unsave job
export const toggleSaveJob = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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

    const job = await Job.findById(id);

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found'
      });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isSaved = job.savedBy.includes(userId);

    if (isSaved) {
      job.savedBy = job.savedBy.filter(id => !id.equals(userId));
    } else {
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
  } catch (error) {
    next(error);
  }
};

// Get saved jobs for user
export const getSavedJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sortField = sortBy as string;
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sort: any = { [sortField]: sortDirection };

    const jobs = await Job.find({ 
      savedBy: new mongoose.Types.ObjectId(req.user.id),
      isActive: true 
    })
      .populate('postedBy', 'name email profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Job.countDocuments({ 
      savedBy: new mongoose.Types.ObjectId(req.user.id),
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
  } catch (error) {
    next(error);
  }
};

// Increment application count
export const incrementApplicationCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid job ID'
      });
      return;
    }

    const job = await Job.findById(id);

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
  } catch (error) {
    next(error);
  }
};

// Get job statistics
export const getJobStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ isActive: true });
    const inactiveJobs = await Job.countDocuments({ isActive: false });
    
    const jobsByType = await Job.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const totalApplications = await Job.aggregate([
      { $group: { _id: null, total: { $sum: '$applicationCount' } } }
    ]);

    const recentJobs = await Job.find()
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
  } catch (error) {
    next(error);
  }
};
