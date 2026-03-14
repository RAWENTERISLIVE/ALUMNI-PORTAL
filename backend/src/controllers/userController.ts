import { Request, Response } from 'express';
import { Role, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

const normalizeRole = (role?: string) => (role || '').toUpperCase();

const isAdminRole = (role?: string) => {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
};

const isSuperAdminRole = (role?: string) => normalizeRole(role) === 'SUPER_ADMIN';

const getTargetUserId = (req: Request): string | undefined => {
  return (req.params as any).id || (req.params as any).userId;
};

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { role, status, search } = req.query;

  const where: any = {};
  if (role) where.role = role as Role;
  if (status) where.status = status as Status;
  if (search) {
    where.OR = [
      { email: { contains: search as string, mode: 'insensitive' } },
      { name: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip, take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.status(200).json({
    success: true, data: users, users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getPublicAlumni = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const { search, graduationYear, company, location } = req.query;

  const where: any = { status: Status.ACTIVE };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { headline: { contains: search as string, mode: 'insensitive' } },
      { company: { contains: search as string, mode: 'insensitive' } },
      { jobTitle: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (typeof graduationYear === 'string' && graduationYear.trim()) {
    where.admissionYear = graduationYear.trim();
  }
  if (company) where.company = { contains: company as string, mode: 'insensitive' };
  if (location) where.location = { contains: location as string, mode: 'insensitive' };

  const [alumni, total] = await Promise.all([
    prisma.user.findMany({
      where, skip, take: limit,
      select: {
        id: true,
        name: true,
        role: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        headline: true,
        jobTitle: true,
        company: true,
        location: true,
        admissionYear: true,
        bio: true
      }
    }),
    prisma.user.count({ where })
  ]);

  res.status(200).json({
    success: true, data: alumni,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.status(200).json({ success: true, data: user });
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      bio: true,
      headline: true,
      city: true,
      country: true,
      company: true,
      jobTitle: true,
      contactEmail: true,
      contactPhone: true,
      linkedInProfile: true,
      location: true,
      privacySettings: true,
      notificationSettings: true
    }
  });

  if (!user) {
    res.status(404).json({ success: false, message: 'Profile not found' });
    return;
  }
  res.status(200).json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (req.user.id !== id && !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const profile = await prisma.user.update({
    where: { id },
    data: { ...req.body }
  });

  res.status(200).json({ success: true, data: profile });
});

export const approveUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: Status.ACTIVE }
  });

  res.status(200).json({ success: true, data: user });
});

export const rejectUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: Status.DELETED }
  });

  res.status(200).json({ success: true, data: user });
});

export const blockUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: Status.SUSPENDED }
  });

  res.status(200).json({ success: true, data: user });
});

export const deleteUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await prisma.user.delete({ where: { id } });
  res.status(200).json({ success: true, data: {} });
});

export const getUserStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const [total, active, pending, suspended, adminUsers, superAdminUsers, recentRegistrations] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: Status.ACTIVE } }),
    prisma.user.count({ where: { status: Status.PENDING } }),
    prisma.user.count({ where: { status: Status.SUSPENDED } }),
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
    prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  ]);

  const stats = {
    totalUsers: total,
    activeUsers: active,
    pendingUsers: pending,
    suspendedUsers: suspended,
    adminUsers,
    superAdminUsers,
    recentRegistrations,
    totalJobs: 0,
    totalGroups: 0,
    totalPosts: 0
  };

  res.status(200).json({ success: true, data: stats, stats });
});

// Stubs for remaining connection logic
export const connectUser = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, message: 'Connected' });
});

export const disconnectUser = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, message: 'Disconnected' });
});

export const getConnectionSuggestions = asyncHandler(async (_req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, data: [] });
});

export const searchAlumni = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: [] });
});

export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { status: Status.PENDING };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: users,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const suspendUser = blockUser;

export const reactivateUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: Status.ACTIVE }
  });

  res.status(200).json({ success: true, data: user });
});

export const promoteToAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isSuperAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: Role.ADMIN }
  });

  res.status(200).json({ success: true, data: user });
});

export const demoteAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isSuperAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: Role.USER }
  });

  res.status(200).json({ success: true, data: user });
});

export const updateUserProfile = updateProfile;

export const getAlumniDirectory = getPublicAlumni;

export const getUserSuggestions = getConnectionSuggestions;
