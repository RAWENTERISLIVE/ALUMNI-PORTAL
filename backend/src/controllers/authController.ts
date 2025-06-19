import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import User, { IUser, UserRole, UserStatus } from '../models/User';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: IUser;
}

// Generate JWT tokens
const generateTokens = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  
  const accessToken = jwt.sign(
    { userId },
    jwtSecret as jwt.Secret,
    { expiresIn: process.env.JWT_EXPIRE || '1h' } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtRefreshSecret as jwt.Secret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

// Register user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    password,
    name,
    admissionNumber,
    needsManualVerification,
    verificationDetails,
    admissionYear: manualAdmissionYear
  } = req.body;

  console.log('Registration request body:', req.body);

  // Basic validation
  if (!email || !password || !name) {
    res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    return;
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User already exists with this email' });
    return;
  }

  let userToCreate: any = {
    email: email.toLowerCase(),
    password,
    name,
    needsManualVerification: needsManualVerification || false,
  };

  const superAdminEmails = ['mpsajmer123@gmail.com', 'futurist.raghav@gmail.com'];
  const isSuperAdmin = superAdminEmails.includes(email.toLowerCase());

  if (needsManualVerification) {
    // Manual verification flow
    if (!verificationDetails || verificationDetails.length < 10) {
      res.status(400).json({ success: false, message: 'Please provide sufficient details for manual verification.' });
      return;
    }
    if (!manualAdmissionYear) {
      res.status(400).json({ success: false, message: 'Admission year is required for manual verification.' });
      return;
    }

    const year = parseInt(manualAdmissionYear, 10);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1989 || year > currentYear + 1) {
      res.status(400).json({ success: false, message: `Admission year must be between 1989 and ${currentYear + 1}.` });
      return;
    }

    userToCreate = {
      ...userToCreate,
      admissionNumber: `501/MV${Math.floor(Math.random()*1e6)}`,
      admissionYear: manualAdmissionYear,
      verificationDetails,
      status: UserStatus.PENDING,
      isVerified: false,
    };
  } else {
    // Standard admission number flow
    if (!admissionNumber) {
      res.status(400).json({ success: false, message: 'Admission number is required.' });
      return;
    }
    // Check if admission number is already used
    const existingAdmission = await User.findOne({ admissionNumber });
    if (existingAdmission) {
      res.status(400).json({ success: false, message: 'Admission number already registered' });
      return;
    }
    // Extract and validate admission year from admission number
    const parts = admissionNumber.split('/');
    if (parts.length < 2) {
        res.status(400).json({ success: false, message: 'Invalid admission number format. Expected format: number/year.' });
        return;
    }
    const yearPart = parts[parts.length - 1];
    const year = parseInt(yearPart, 10);
    const currentYear = new Date().getFullYear();
    let admissionYear;
    if (yearPart.length === 2) {
      if (year >= 89 && year <= 99) {
        admissionYear = `19${year}`;
      } else {
        admissionYear = `20${year.toString().padStart(2, '0')}`;
      }
    } else {
      admissionYear = year.toString();
    }
    const numericAdmissionYear = parseInt(admissionYear, 10);
    if (isNaN(numericAdmissionYear) || numericAdmissionYear < 1989 || numericAdmissionYear > currentYear + 1) {
      res.status(400).json({ success: false, message: `Invalid admission year. Must be between 1989 and ${currentYear + 1}.` });
      return;
    }
    userToCreate = {
      ...userToCreate,
      admissionNumber,
      admissionYear,
      status: isSuperAdmin ? UserStatus.ACTIVE : UserStatus.PENDING,
      isVerified: isSuperAdmin,
    };
  }
  userToCreate.role = isSuperAdmin ? UserRole.SUPER_ADMIN : UserRole.USER;

  try {
    // Create user
    const user = await User.create(userToCreate);
    // For non-super-admins, we don't log them in, just send a success message.
    if (!isSuperAdmin) {
      res.status(201).json({
        success: true,
        message: 'Registration successful. Your account is pending approval.',
        needsManualVerification: !!needsManualVerification,
      });
      return;
    }
    // For super-admins, generate tokens and log them in
    const { accessToken, refreshToken } = generateTokens(user._id);
    // Add refresh token to user
    user.refreshTokens.push(refreshToken);
    await user.save();
    res.status(201).json({
      success: true,
      message: 'Super admin account created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified
      },
      accessToken,
      refreshToken
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    res.status(400).json({ message: 'Please provide email and password' });
    return;
  }

  // Check for user and include password in the query
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }

  // Check if account is active
  if (user.status === UserStatus.PENDING) {
    res.status(403).json({ message: 'Account pending approval' });
    return;
  }

  if (user.status === UserStatus.SUSPENDED) {
    res.status(403).json({ message: 'Account suspended' });
    return;
  }

  if (user.status === UserStatus.DELETED) {
    res.status(403).json({ message: 'Account not found' });
    return;
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Add refresh token to user
  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      admissionNumber: user.admissionNumber,
      profileImage: user.profileImage,
      bio: user.bio,
      headline: user.headline,
      city: user.city,
      country: user.country,
      company: user.company,
      jobTitle: user.jobTitle
    },
    accessToken,
    refreshToken
  });
});

// Refresh token
export const refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401).json({ message: 'Refresh token required' });
    return;
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    ) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Generate new tokens
    const tokens = generateTokens(user._id);

    // Replace old refresh token with new one
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// Logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (req.user && refreshToken) {
    req.user.refreshTokens = req.user.refreshTokens.filter(token => token !== refreshToken);
    await req.user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user
export const getMe = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  res.status(200).json({
    success: true,
    user: req.user
  });
});

// Forgot password
export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  // Generate reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // In a real application, you would send an email here
  // For now, we'll just return the token (remove this in production)
  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    resetToken // Remove this in production
  });
});

// Reset password
export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ message: 'Token and password are required' });
    return;
  }

  // Find user by reset token
  const user = await User.findOne({
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken');

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
    return;
  }

  // Verify token
  const isTokenValid = await user.comparePassword(token);
  if (!isTokenValid) {
    res.status(400).json({ message: 'Invalid reset token' });
    return;
  }

  // Update password
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshTokens = []; // Invalidate all refresh tokens
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful'
  });
});
