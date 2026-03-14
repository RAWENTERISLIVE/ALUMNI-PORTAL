import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
    name?: string;
  };
}

const isAdminRole = (role?: string) => {
  const normalized = (role || '').toLowerCase();
  return normalized === 'admin' || normalized === 'super_admin' || role === Role.ADMIN || role === Role.SUPER_ADMIN;
};

const formatJob = (job: any) => ({
  ...job,
  salaryRange:
    job.salaryRangeMin !== null && job.salaryRangeMin !== undefined &&
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

export const getJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = Number.parseInt(req.query.page as string, 10) || 1;
  const limit = Number.parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  const {
    type,
    location,
    company,
    isActive = 'true',
    postedBy,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const where: any = {};
  
  if (isActive !== 'all') where.isActive = isActive === 'true';
  if (type) where.type = type as string;
  if (location) where.location = { contains: location as string, mode: 'insensitive' };
  if (company) where.company = { contains: company as string, mode: 'insensitive' };
  if (postedBy) where.postedById = postedBy as string;
  if (tags) {
    const tagArray = (tags as string).split(',').map(tag => tag.trim());
    where.tags = { hasSome: tagArray };
  }

  const orderBy: any = {};
  if (sortBy) orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
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
    prisma.job.count({ where })
  ]);

  const formattedJobs = jobs.map(formatJob);

  res.status(200).json({
    success: true,
    data: formattedJobs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getJobById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  const job = await prisma.job.findUnique({
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

export const createJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, company, location, type, salaryRange, description, requirements, benefits, applicationUrl, contactEmail, isAlumniReferral, applicationDeadline, tags } = req.body;

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!title || !company || !location || !type || !description) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }

  const postingUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true }
  });

  const jobData: any = {
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
  if (applicationUrl) jobData.applicationUrl = applicationUrl;
  if (contactEmail) jobData.contactEmail = contactEmail;
  if (applicationDeadline) jobData.applicationDeadline = new Date(applicationDeadline);

  const job = await prisma.job.create({
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

export const updateJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

  const job = await prisma.job.findUnique({ where: { id } });
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

  const dataToUpdate: any = {};
  for (const key of Object.keys(updateData)) {
    if (allowedUpdates.has(key)) {
      if (key === 'salaryRange' && updateData[key]) {
        dataToUpdate.salaryRangeMin = Number(updateData[key].min);
        dataToUpdate.salaryRangeMax = Number(updateData[key].max);
        dataToUpdate.salaryCurrency = updateData[key].currency || 'USD';
      } else if (key === 'applicationDeadline' && updateData[key]) {
        dataToUpdate.applicationDeadline = new Date(updateData[key]);
      } else {
        dataToUpdate[key] = updateData[key];
      }
    }
  }

  const updatedJob = await prisma.job.update({
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

export const deleteJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }
  if (job.postedById !== req.user.id && !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }
  await prisma.job.delete({ where: { id } });
  res.status(200).json({ success: true, data: {} });
});

export const saveJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  await prisma.job.update({
    where: { id },
    data: {
      savedBy: {
        connect: { id: req.user.id }
      }
    }
  });

  res.status(200).json({ success: true, message: 'Job saved' });
});

export const unsaveJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  await prisma.job.update({
    where: { id },
    data: {
      savedBy: {
        disconnect: { id: req.user.id }
      }
    }
  });

  res.status(200).json({ success: true, message: 'Job unsaved' });
});

export const getSavedJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const jobs = await prisma.job.findMany({
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

export const getAppliedJobs = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ success: true, data: [] });
});

export const toggleSaveJob = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  const savedJob = await prisma.job.findFirst({
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
    await prisma.job.update({
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

  await prisma.job.update({
    where: { id },
    data: {
      savedBy: {
        connect: { id: req.user.id }
      }
    }
  });

  res.status(200).json({ success: true, message: 'Job saved', data: { saved: true } });
});

export const incrementApplicationCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'Job ID is required' });
    return;
  }

  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) {
    res.status(404).json({ success: false, message: 'Job not found' });
    return;
  }

  const updated = await prisma.job.update({
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

export const searchJobs = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const rawQuery = req.query.query;
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  if (!query) {
    res.status(200).json({ success: true, data: [] });
    return;
  }

  const jobs = await prisma.job.findMany({
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

export const getJobStats = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const totalJobs = await prisma.job.count();
  const activeJobs = await prisma.job.count({ where: { isActive: true } });
  const applications = await prisma.job.aggregate({ _sum: { applicationCount: true } });

  res.status(200).json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      totalApplications: applications._sum.applicationCount || 0
    }
  });
});

