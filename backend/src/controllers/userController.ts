import { Request, Response } from 'express';
import { ConnectionRequestStatus, Prisma, Role, Status } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { getHiddenSystemAccountEmails, isHiddenSystemAccountEmail } from '../config/systemAccounts';
import { createNotification } from '../utils/notifications';

interface AuthRequest extends Request {
  user?: any;
}

const normalizeRole = (role?: string) => (role || '').toUpperCase();
const normalizeStatus = (status?: string) => (status || '').toUpperCase();

const serializeUser = (user: any) => ({
  ...user,
  role: typeof user?.role === 'string' ? user.role.toLowerCase() : user?.role,
  status: typeof user?.status === 'string' ? user.status.toLowerCase() : user?.status,
});

const isAdminRole = (role?: string) => {
  const normalized = normalizeRole(role);
  return normalized === 'MODERATOR' || normalized === 'ADMIN' || normalized === 'SUPER_ADMIN';
};

const isSuperAdminRole = (role?: string) => normalizeRole(role) === 'SUPER_ADMIN';

const hiddenSystemEmails = () => [...getHiddenSystemAccountEmails()];

const notHiddenSystemAccountsFilter = () => ({ notIn: hiddenSystemEmails() });

const getTargetUserId = (req: Request): string | undefined => {
  return (req.params as any).id || (req.params as any).userId;
};

const getAuthenticatedUserId = (req: AuthRequest): string | undefined => {
  const user = req.user as any;
  return user?.id || user?._id;
};

const isMissingDirectMessageTableError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2021' && String(error.meta?.table || '').includes('DirectMessage');
  }

  if (error instanceof Error) {
    return error.message.includes('DirectMessage') && error.message.includes('does not exist');
  }

  return false;
};

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { role, status, search } = req.query;

  const where: any = {};
  where.email = notHiddenSystemAccountsFilter();
  if (role) where.role = normalizeRole(String(role)) as Role;
  if (status) where.status = normalizeStatus(String(status)) as Status;
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

  const serializedUsers = users.map((user) => serializeUser(user));

  res.status(200).json({
    success: true, data: serializedUsers, users: serializedUsers,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getPublicAlumni = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const { search, graduationYear, company, location } = req.query;
  const authReq = req as AuthRequest;
  const currentUserId = getAuthenticatedUserId(authReq);

  let connectedUserIds = new Set<string>();
  let pendingSentUserIds = new Set<string>();
  let pendingIncomingUserIds = new Set<string>();
  let followingUserIds = new Set<string>();

  if (currentUserId) {
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        connections: { select: { id: true } },
        connectedTo: { select: { id: true } },
        sentConnectionRequests: {
          where: { status: ConnectionRequestStatus.PENDING },
          select: { receiverId: true }
        },
        receivedConnectionRequests: {
          where: { status: ConnectionRequestStatus.PENDING },
          select: { senderId: true }
        },
        followingRelationships: { select: { followingId: true } }
      }
    });

    if (currentUser) {
      connectedUserIds = new Set([
        ...currentUser.connections.map((user) => user.id),
        ...currentUser.connectedTo.map((user) => user.id)
      ]);
      pendingSentUserIds = new Set(currentUser.sentConnectionRequests.map((request) => request.receiverId));
      pendingIncomingUserIds = new Set(currentUser.receivedConnectionRequests.map((request) => request.senderId));
      followingUserIds = new Set(currentUser.followingRelationships.map((relation) => relation.followingId));
    }
  }

  const where: any = {
    status: Status.ACTIVE,
    email: notHiddenSystemAccountsFilter()
  };

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

  const alumniWithConnectionStatus = alumni
    .filter((user) => user.id !== currentUserId)
    .map((user) => ({
      ...user,
      connectionStatus: connectedUserIds.has(user.id)
        ? 'connected'
        : pendingIncomingUserIds.has(user.id)
          ? 'incoming'
          : pendingSentUserIds.has(user.id)
            ? 'pending'
            : 'none',
      isFollowing: followingUserIds.has(user.id)
    }));

  res.status(200).json({
    success: true, data: alumniWithConnectionStatus,
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
    where: { id },
    include: {
      mentorshipProfile: {
        select: {
          id: true,
          isMentor: true,
          isActive: true,
          expertise: true,
          availability: true,
          communicationPreferences: true
        }
      }
    }
  });

  const authReq = req as AuthRequest;
  const currentUserId = getAuthenticatedUserId(authReq);

  if (!user || (isHiddenSystemAccountEmail(user.email) && currentUserId !== user.id)) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  let connectionStatus: 'none' | 'pending' | 'incoming' | 'connected' = 'none';

  if (currentUserId && currentUserId !== user.id) {
    const [isConnected, sentPending, incomingPending] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: currentUserId,
          OR: [
            { connections: { some: { id: user.id } } },
            { connectedTo: { some: { id: user.id } } }
          ]
        },
        select: { id: true }
      }),
      prisma.connectionRequest.findFirst({
        where: {
          senderId: currentUserId,
          receiverId: user.id,
          status: ConnectionRequestStatus.PENDING
        },
        select: { id: true }
      }),
      prisma.connectionRequest.findFirst({
        where: {
          senderId: user.id,
          receiverId: currentUserId,
          status: ConnectionRequestStatus.PENDING
        },
        select: { id: true }
      })
    ]);

    if (isConnected) {
      connectionStatus = 'connected';
    } else if (incomingPending) {
      connectionStatus = 'incoming';
    } else if (sentPending) {
      connectionStatus = 'pending';
    }
  }

  res.status(200).json({
    success: true,
    data: serializeUser({ ...user, connectionStatus })
  });
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
      email: true,
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

  const authReq = req as AuthRequest;
  const currentUserId = getAuthenticatedUserId(authReq);

  if (!user || (isHiddenSystemAccountEmail((user as { email?: string | null }).email) && currentUserId !== user.id)) {
    res.status(404).json({ success: false, message: 'Profile not found' });
    return;
  }
  const profileData = { ...user } as Record<string, unknown>;
  delete profileData.email;

  res.status(200).json({ success: true, data: profileData });
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

  res.status(200).json({ success: true, data: serializeUser(profile) });
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
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

  const hiddenEmailFilter = { email: notHiddenSystemAccountsFilter() };

  const [total, active, pending, suspended, moderatorUsers, adminUsers, superAdminUsers, recentRegistrations] = await Promise.all([
    prisma.user.count({ where: hiddenEmailFilter }),
    prisma.user.count({ where: { ...hiddenEmailFilter, status: Status.ACTIVE } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, status: Status.PENDING } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, status: Status.SUSPENDED } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, role: 'MODERATOR' as Role } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, role: Role.ADMIN } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, role: Role.SUPER_ADMIN } }),
    prisma.user.count({ where: { ...hiddenEmailFilter, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } })
  ]);

  const stats = {
    totalUsers: total,
    activeUsers: active,
    pendingUsers: pending,
    suspendedUsers: suspended,
    moderatorUsers,
    adminUsers,
    superAdminUsers,
    recentRegistrations,
    totalJobs: 0,
    totalGroups: 0,
    totalPosts: 0
  };

  res.status(200).json({ success: true, data: stats, stats });
});

export const connectUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  if (currentUserId === targetUserId) {
    res.status(400).json({ success: false, message: 'Cannot connect with yourself' });
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true, email: true }
  });

  if (!targetUser || targetUser.status !== Status.ACTIVE || isHiddenSystemAccountEmail(targetUser.email)) {
    res.status(404).json({ success: false, message: 'Target user not found or inactive' });
    return;
  }

  const alreadyConnected = await prisma.user.findFirst({
    where: {
      id: currentUserId,
      OR: [
        { connections: { some: { id: targetUserId } } },
        { connectedTo: { some: { id: targetUserId } } }
      ]
    },
    select: { id: true }
  });

  if (alreadyConnected) {
    res.status(200).json({ success: true, message: 'Already connected', data: { connectionStatus: 'connected' } });
    return;
  }

  const incomingPendingRequest = await prisma.connectionRequest.findFirst({
    where: {
      senderId: targetUserId,
      receiverId: currentUserId,
      status: ConnectionRequestStatus.PENDING
    },
    select: { id: true }
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { id: true, name: true }
  });

  if (incomingPendingRequest) {
    await prisma.$transaction([
      prisma.connectionRequest.update({
        where: { id: incomingPendingRequest.id },
        data: { status: ConnectionRequestStatus.ACCEPTED, respondedAt: new Date() }
      }),
      prisma.user.update({
        where: { id: currentUserId },
        data: { connections: { connect: { id: targetUserId } } }
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { connections: { connect: { id: currentUserId } } }
      })
    ]);

    await createNotification({
      userId: targetUserId,
      title: 'Connection accepted',
      message: `${currentUser?.name || 'A user'} accepted your connection request.`,
      type: 'connection',
      actionUrl: `/directory/profile/${currentUserId}`,
      metadata: { userId: currentUserId, event: 'connection_accepted' }
    });

    res.status(200).json({
      success: true,
      message: 'Connection request accepted successfully',
      data: { connectionStatus: 'connected' }
    });
    return;
  }

  const outgoingPendingRequest = await prisma.connectionRequest.findFirst({
    where: {
      senderId: currentUserId,
      receiverId: targetUserId,
      status: ConnectionRequestStatus.PENDING
    },
    select: { id: true }
  });

  if (outgoingPendingRequest) {
    res.status(200).json({
      success: true,
      message: 'Connection request already pending',
      data: { connectionStatus: 'pending' }
    });
    return;
  }

  await prisma.connectionRequest.upsert({
    where: {
      senderId_receiverId: {
        senderId: currentUserId,
        receiverId: targetUserId
      }
    },
    update: {
      status: ConnectionRequestStatus.PENDING,
      respondedAt: null
    },
    create: {
      senderId: currentUserId,
      receiverId: targetUserId,
      status: ConnectionRequestStatus.PENDING
    }
  });

  await createNotification({
    userId: targetUserId,
    title: 'New connection request',
    message: `${currentUser?.name || 'A user'} sent you a connection request.`,
    type: 'connection',
    actionUrl: `/directory/profile/${currentUserId}`,
    metadata: { userId: currentUserId, event: 'connection_request' }
  });

  res.status(200).json({
    success: true,
    message: 'Connection request sent successfully',
    data: { connectionStatus: 'pending' }
  });
});

export const acceptConnectionRequest = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  const pendingRequest = await prisma.connectionRequest.findFirst({
    where: {
      senderId: targetUserId,
      receiverId: currentUserId,
      status: ConnectionRequestStatus.PENDING
    },
    select: { id: true }
  });

  if (!pendingRequest) {
    res.status(404).json({ success: false, message: 'No pending request from this user' });
    return;
  }

  await prisma.$transaction([
    prisma.connectionRequest.update({
      where: { id: pendingRequest.id },
      data: { status: ConnectionRequestStatus.ACCEPTED, respondedAt: new Date() }
    }),
    prisma.user.update({
      where: { id: currentUserId },
      data: { connections: { connect: { id: targetUserId } } }
    }),
    prisma.user.update({
      where: { id: targetUserId },
      data: { connections: { connect: { id: currentUserId } } }
    })
  ]);

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { id: true, name: true }
  });

  await createNotification({
    userId: targetUserId,
    title: 'Connection accepted',
    message: `${currentUser?.name || 'A user'} accepted your connection request.`,
    type: 'connection',
    actionUrl: `/directory/profile/${currentUserId}`,
    metadata: { userId: currentUserId, event: 'connection_accepted' }
  });

  res.status(200).json({
    success: true,
    message: 'Connection accepted successfully',
    data: { connectionStatus: 'connected' }
  });
});

export const disconnectUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  if (currentUserId === targetUserId) {
    res.status(400).json({ success: false, message: 'Cannot disconnect from yourself' });
    return;
  }

  const isConnected = await prisma.user.findFirst({
    where: {
      id: currentUserId,
      OR: [
        { connections: { some: { id: targetUserId } } },
        { connectedTo: { some: { id: targetUserId } } }
      ]
    },
    select: { id: true }
  });

  const operations: any[] = [
    prisma.connectionRequest.deleteMany({
      where: {
        OR: [
          {
            senderId: currentUserId,
            receiverId: targetUserId,
            status: ConnectionRequestStatus.PENDING
          },
          {
            senderId: targetUserId,
            receiverId: currentUserId,
            status: ConnectionRequestStatus.PENDING
          }
        ]
      }
    })
  ];

  if (isConnected) {
    operations.push(
      prisma.user.update({
        where: { id: currentUserId },
        data: { connections: { disconnect: { id: targetUserId } } }
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: { connections: { disconnect: { id: currentUserId } } }
      })
    );
  }

  await prisma.$transaction(operations);

  res.status(200).json({
    success: true,
    message: isConnected ? 'Disconnected successfully' : 'Connection request removed',
    data: { connectionStatus: 'none' }
  });
});

export const followUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  if (currentUserId === targetUserId) {
    res.status(400).json({ success: false, message: 'Cannot follow yourself' });
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, status: true, email: true }
  });

  if (!targetUser || targetUser.status !== Status.ACTIVE || isHiddenSystemAccountEmail(targetUser.email)) {
    res.status(404).json({ success: false, message: 'Target user not found or inactive' });
    return;
  }

  await prisma.follow.upsert({
    where: {
      followerId_followingId: {
        followerId: currentUserId,
        followingId: targetUserId
      }
    },
    update: {},
    create: {
      followerId: currentUserId,
      followingId: targetUserId
    }
  });

  res.status(200).json({ success: true, message: 'Now following user', data: { isFollowing: true } });
});

export const unfollowUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  await prisma.follow.deleteMany({
    where: {
      followerId: currentUserId,
      followingId: targetUserId
    }
  });

  res.status(200).json({ success: true, message: 'Unfollowed user', data: { isFollowing: false } });
});

export const getDirectConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  let messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  try {
    messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        isRead: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (isMissingDirectMessageTableError(error)) {
      res.status(200).json({
        success: true,
        data: [],
        message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
      });
      return;
    }

    throw error;
  }

  const conversationMap = new Map<string, {
    userId: string;
    lastMessage: string;
    lastMessageAt: Date;
    lastMessageFromMe: boolean;
    unreadCount: number;
  }>();

  for (const message of messages) {
    const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const existing = conversationMap.get(otherUserId);

    if (!existing) {
      conversationMap.set(otherUserId, {
        userId: otherUserId,
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
        lastMessageFromMe: message.senderId === currentUserId,
        unreadCount: message.receiverId === currentUserId && !message.isRead ? 1 : 0
      });
      continue;
    }

    if (message.receiverId === currentUserId && !message.isRead) {
      existing.unreadCount += 1;
      conversationMap.set(otherUserId, existing);
    }
  }

  const participantIds = [...conversationMap.keys()];
  const participants = participantIds.length > 0
    ? await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, name: true, profileImage: true, status: true, email: true }
    })
    : [];

  const participantById = new Map(participants.map((user) => [user.id, user]));

  const conversations = [...conversationMap.values()]
    .map((conversation) => {
      const participant = participantById.get(conversation.userId);
      if (!participant || participant.status !== Status.ACTIVE || isHiddenSystemAccountEmail(participant.email)) {
        return null;
      }

      return {
        ...conversation,
        participant: {
          id: participant.id,
          name: participant.name,
          profileImage: participant.profileImage
        }
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => right.lastMessageAt.getTime() - left.lastMessageAt.getTime());

  res.status(200).json({ success: true, data: conversations });
});

export const getDirectMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true }
  });

  if (!targetUser || isHiddenSystemAccountEmail(targetUser.email)) {
    res.status(404).json({ success: false, message: 'Target user not found' });
    return;
  }

  const areConnected = await prisma.user.findFirst({
    where: {
      id: currentUserId,
      OR: [
        { connections: { some: { id: targetUserId } } },
        { connectedTo: { some: { id: targetUserId } } }
      ]
    },
    select: { id: true }
  });

  if (!areConnected) {
    res.status(403).json({ success: false, message: 'You can only message connected users' });
    return;
  }

  let messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  try {
    messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        isRead: true,
        createdAt: true
      }
    });

    await prisma.directMessage.updateMany({
      where: {
        senderId: targetUserId,
        receiverId: currentUserId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  } catch (error) {
    if (isMissingDirectMessageTableError(error)) {
      res.status(200).json({
        success: true,
        data: [],
        message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
      });
      return;
    }

    throw error;
  }

  res.status(200).json({ success: true, data: messages });
});

export const sendDirectMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  const targetUserId = getTargetUserId(req);
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!targetUserId) {
    res.status(400).json({ success: false, message: 'Target user ID is required' });
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true }
  });

  if (!targetUser || isHiddenSystemAccountEmail(targetUser.email)) {
    res.status(404).json({ success: false, message: 'Target user not found' });
    return;
  }

  if (currentUserId === targetUserId) {
    res.status(400).json({ success: false, message: 'Cannot message yourself' });
    return;
  }

  if (!content) {
    res.status(400).json({ success: false, message: 'Message content is required' });
    return;
  }

  if (content.length > 2000) {
    res.status(400).json({ success: false, message: 'Message content must not exceed 2000 characters' });
    return;
  }

  const areConnected = await prisma.user.findFirst({
    where: {
      id: currentUserId,
      OR: [
        { connections: { some: { id: targetUserId } } },
        { connectedTo: { some: { id: targetUserId } } }
      ]
    },
    select: { id: true }
  });

  if (!areConnected) {
    res.status(403).json({ success: false, message: 'You can only message connected users' });
    return;
  }

  let message: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  };

  try {
    message = await prisma.directMessage.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUserId,
        content
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        content: true,
        isRead: true,
        createdAt: true
      }
    });
  } catch (error) {
    if (isMissingDirectMessageTableError(error)) {
      res.status(503).json({
        success: false,
        message: 'Direct messaging is not available yet. Please run the latest backend database migrations.'
      });
      return;
    }

    throw error;
  }

  res.status(201).json({ success: true, message: 'Message sent', data: message });
});

export const getConnectionSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const currentUserId = getAuthenticatedUserId(req);
  if (!currentUserId) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const requestedLimit = Number.parseInt(req.query.limit as string) || 8;
  const limit = Math.min(Math.max(requestedLimit, 1), 20);

  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      company: true,
      location: true,
      admissionYear: true,
      connections: { select: { id: true } },
      connectedTo: { select: { id: true } }
    }
  });

  if (!currentUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const excludedIds = new Set<string>([
    currentUserId,
    ...currentUser.connections.map((user) => user.id),
    ...currentUser.connectedTo.map((user) => user.id)
  ]);

  const candidates = await prisma.user.findMany({
    where: {
      status: Status.ACTIVE,
      id: { notIn: [...excludedIds] },
      email: notHiddenSystemAccountsFilter()
    },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      profileImage: true,
      headline: true,
      jobTitle: true,
      company: true,
      location: true,
      admissionYear: true,
      bio: true,
      createdAt: true
    },
    take: 50
  });

  const suggestions = candidates
    .map((candidate) => {
      let score = 0;

      if (candidate.company) score += 2;
      if (candidate.location) score += 2;
      if (candidate.headline || candidate.jobTitle) score += 2;
      if (candidate.bio) score += 1;

      if (currentUser.company && candidate.company && currentUser.company.toLowerCase() === candidate.company.toLowerCase()) {
        score += 5;
      }

      if (currentUser.location && candidate.location && currentUser.location.toLowerCase() === candidate.location.toLowerCase()) {
        score += 4;
      }

      if (currentUser.admissionYear && candidate.admissionYear && currentUser.admissionYear === candidate.admissionYear) {
        score += 3;
      }

      return {
        ...candidate,
        score,
        connectionStatus: 'none'
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  res.status(200).json({ success: true, data: suggestions });
});

export const searchAlumni = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: [] });
});

export const getPendingUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { status: Status.PENDING, email: notHiddenSystemAccountsFilter() };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const serializedUsers = users.map((user) => serializeUser(user));

  res.status(200).json({
    success: true,
    data: serializedUsers,
    users: serializedUsers,
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
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

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: Role.ADMIN }
  });

  res.status(200).json({ success: true, data: user });
});

export const promoteToModerator = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isSuperAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: 'MODERATOR' as Role }
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

  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });

  if (!targetUser || isHiddenSystemAccountEmail(targetUser.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const nextRole = String(targetUser.role) === 'ADMIN' ? ('MODERATOR' as Role) : Role.USER;

  const user = await prisma.user.update({
    where: { id },
    data: { role: nextRole }
  });

  res.status(200).json({ success: true, data: user });
});

export const setPremiumBadge = asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = getTargetUserId(req);
  if (!id) {
    res.status(400).json({ success: false, message: 'User ID is required' });
    return;
  }

  if (!req.user || !isSuperAdminRole(req.user.role)) {
    res.status(403).json({ success: false, message: 'Only super admin can assign premium badge' });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  if (!target || isHiddenSystemAccountEmail(target.email)) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const enabled = typeof req.body?.enabled === 'boolean' ? req.body.enabled : true;

  const user = await prisma.user.update({
    where: { id },
    data: { hasPremiumBadge: enabled } as any,
  });

  res.status(200).json({ success: true, data: serializeUser(user) });
});

export const updateUserProfile = updateProfile;

export const getAlumniDirectory = getPublicAlumni;

export const getUserSuggestions = getConnectionSuggestions;
