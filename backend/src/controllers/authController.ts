import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

// Extend Express Request to include user
interface AuthRequest extends Request {
  user?: any;
}

const isBcryptHash = (value: string) => value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');

const verifyPassword = async (inputPassword: string, storedPassword: string): Promise<boolean> => {
  if (!storedPassword) return false;

  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(inputPassword, storedPassword);
  }

  return inputPassword === storedPassword;
};

const toClientRole = (role: Role) => {
  if (role === Role.SUPER_ADMIN) return 'super_admin';
  if (role === Role.ADMIN) return 'admin';
  return 'user';
};

const generateTokens = (userId: string) => {
  const payload = { userId };
  
  const accessToken = jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, name, role, admissionNumber, admissionYear } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'Email already registered' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const resolvedName = (name || [firstName, lastName].filter(Boolean).join(' ')).trim();
  const inferredAdmissionYear =
    admissionYear ||
    (typeof admissionNumber === 'string' && admissionNumber.includes('/')
      ? `20${admissionNumber.split('/').pop()}`
      : undefined) ||
    new Date().getFullYear().toString();

  const resolvedRole =
    role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'USER'
      ? role
      : role === 'super_admin'
      ? Role.SUPER_ADMIN
      : role === 'admin'
      ? Role.ADMIN
      : Role.USER;

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role: resolvedRole,
      name: resolvedName || email.split('@')[0],
      firstName,
      lastName,
      admissionNumber: admissionNumber || 'N/A',
      admissionYear: inferredAdmissionYear
    },
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toClientRole(user.role),
      admissionNumber: user.admissionNumber,
      admissionYear: user.admissionYear,
      status: user.status.toLowerCase(),
      isVerified: user.isVerified
    },
    accessToken,
    refreshToken,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: toClientRole(user.role),
        admissionNumber: user.admissionNumber,
        admissionYear: user.admissionYear,
        status: user.status.toLowerCase(),
        isVerified: user.isVerified
      },
      accessToken
    }
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  // Automatically upgrade legacy plaintext passwords to bcrypt after successful login
  if (!isBcryptHash(user.password)) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  const { accessToken, refreshToken } = generateTokens(user.id);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toClientRole(user.role),
      admissionNumber: user.admissionNumber,
      admissionYear: user.admissionYear,
      status: user.status.toLowerCase(),
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      bio: user.bio,
      headline: user.headline,
      city: user.city,
      country: user.country,
      company: user.company,
      jobTitle: user.jobTitle
    },
    accessToken,
    refreshToken,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: toClientRole(user.role),
        admissionNumber: user.admissionNumber,
        admissionYear: user.admissionYear,
        status: user.status.toLowerCase(),
        isVerified: user.isVerified,
        profileImage: user.profileImage,
        bio: user.bio,
        headline: user.headline,
        city: user.city,
        country: user.country,
        company: user.company,
        jobTitle: user.jobTitle
      },
      accessToken
    }
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  
  if (!token) {
    res.status(401).json({ success: false, message: 'Refresh token not found' });
    return;
  }

  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret'
    ) as any;

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens(user.id);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      data: { accessToken: tokens.accessToken }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.status(200).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: toClientRole(user.role),
      admissionNumber: user.admissionNumber,
      admissionYear: user.admissionYear,
      status: user.status.toLowerCase(),
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      bio: user.bio,
      headline: user.headline,
      city: user.city,
      country: user.country,
      contactEmail: user.contactEmail,
      contactPhone: user.contactPhone,
      linkedInProfile: user.linkedInProfile,
      company: user.company,
      jobTitle: user.jobTitle,
      isAvailableAsMentor: user.isAvailableAsMentor,
      location: user.location,
      notificationSettings: user.notificationSettings,
      privacySettings: user.privacySettings
    }
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  // Stub for forgotten password logic
  res.status(200).json({ success: true, message: 'Password reset email sent' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  // Stub for reset password logic
  res.status(200).json({ success: true, message: 'Password has been reset' });
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const { currentPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const isMatch = await verifyPassword(currentPassword, user.password);
  if (!isMatch) {
    res.status(400).json({ success: false, message: 'Invalid current password' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

export const updateNotificationSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const settings = await prisma.user.update({
    where: { id: req.user.id },
    data: { notificationSettings: { ...(req.body || {}) } },
    select: { notificationSettings: true }
  });

  res.status(200).json({ success: true, data: settings.notificationSettings });
});

export const updatePrivacySettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const settings = await prisma.user.update({
    where: { id: req.user.id },
    data: { privacySettings: { ...(req.body || {}) } },
    select: { privacySettings: true }
  });

  res.status(200).json({ success: true, data: settings.privacySettings });
});
