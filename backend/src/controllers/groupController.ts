import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { createNotification } from '../utils/notifications';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
}

interface GroupSettingsPayload {
  name?: string;
  description?: string;
  privacy?: 'public' | 'private';
  category?: string;
}

const getGroupId = (req: Request) => req.params.groupId || req.params.id;

const isUserMember = (members: Array<{ id: string }>, userId: string) =>
  members.some((member) => member.id === userId);

const getRequiredGroupId = (req: Request, res: Response): string | null => {
  const groupId = getGroupId(req);
  if (!groupId) {
    res.status(400).json({ message: 'Group ID is required' });
    return null;
  }
  return groupId;
};

const getSafeActorName = async (userId: string): Promise<string> => {
  const actor = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, firstName: true, email: true }
  });

  return actor?.name || actor?.firstName || actor?.email?.split('@')[0] || 'A member';
};

const createSystemMessage = async (groupId: string, authorId: string, content: string) => {
  await prisma.groupMessage.create({
    data: {
      groupId,
      authorId,
      content,
      messageType: 'system'
    }
  });
};

const isGroupAdmin = (group: { creatorId: string }, userId: string) => group.creatorId === userId;

const normalizeRole = (role?: string) => (role || '').toLowerCase();

const isWatcherRole = (role?: string) => {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'super_admin' || normalized === 'moderator';
};

const isSuperAdminRole = (role?: string) => normalizeRole(role) === 'super_admin';

const getNextAdminCandidateId = async (
  groupId: string,
  currentAdminId: string,
  memberIds: string[]
): Promise<string | null> => {
  const candidateIds = memberIds.filter((id) => id !== currentAdminId);
  if (candidateIds.length === 0) return null;

  const joinMessages = await prisma.groupMessage.findMany({
    where: {
      groupId,
      messageType: 'system',
      authorId: { in: candidateIds },
      content: {
        contains: 'joined the group',
        mode: 'insensitive'
      }
    },
    select: { authorId: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const seen = new Set<string>();
  for (const message of joinMessages) {
    if (!seen.has(message.authorId)) {
      seen.add(message.authorId);
      return message.authorId;
    }
  }

  const fallbackUsers = await prisma.user.findMany({
    where: { id: { in: candidateIds } },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  return fallbackUsers[0]?.id || null;
};

export const createGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const group = await prisma.group.create({
    data: { ...req.body, creatorId: req.user.id, members: { connect: { id: req.user.id } } },
    include: { creator: true, members: true }
  });
  res.status(201).json({ success: true, data: group });
});

export const getGroups = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const isWatcher = isWatcherRole(req.user.role);

  const queryOptions = {
    include: { creator: true, members: true },
    orderBy: { createdAt: 'desc' as const }
  };

  const groups = isWatcher
    ? await prisma.group.findMany(queryOptions)
    : await prisma.group.findMany({
        ...queryOptions,
        where: {
          OR: [
            { privacy: 'public' },
            { creatorId: req.user.id },
            { members: { some: { id: req.user.id } } }
          ]
        }
      });
  res.status(200).json({ success: true, data: groups });
});

export const getGroupById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      creator: { select: { id: true, name: true, profileImage: true, email: true } },
      members: { select: { id: true, name: true, profileImage: true, email: true } }
    }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  const canAccess =
    isWatcherRole(req.user.role) ||
    group.privacy !== 'private' ||
    group.creatorId === req.user.id ||
    isUserMember(group.members, req.user.id);
  if (!canAccess) { res.status(403).json({ message: 'Not authorized to access this group' }); return; }

  res.status(200).json({ success: true, data: group });
});

export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.creatorId !== req.user?.id) { res.status(403).json({ message: 'Not authorized' }); return; }

  const payload = req.body as GroupSettingsPayload;
  const updateData: GroupSettingsPayload = {};

  if (typeof payload.name === 'string') updateData.name = payload.name.trim();
  if (typeof payload.description === 'string') updateData.description = payload.description.trim();
  if (payload.privacy === 'public' || payload.privacy === 'private') updateData.privacy = payload.privacy;
  if (typeof payload.category === 'string') updateData.category = payload.category.trim();

  const updated = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
    include: {
      creator: { select: { id: true, name: true, profileImage: true, email: true } },
      members: { select: { id: true, name: true, profileImage: true, email: true } }
    }
  });

  res.status(200).json({ success: true, data: updated });
});

export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    res.status(404).json({ success: false, message: 'Group not found' });
    return;
  }

  const canDelete = group.creatorId === req.user?.id || isSuperAdminRole(req.user?.role);
  if (!canDelete) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await prisma.group.delete({ where: { id: groupId } });
  res.status(200).json({ success: true, message: 'Group deleted successfully' });
});

export const joinGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  if (group.privacy === 'private') {
    const existingRequest = await prisma.groupJoinRequest.findUnique({
      where: {
        groupId_requesterId: {
          groupId,
          requesterId: req.user.id
        }
      }
    });

    if (existingRequest?.status === 'pending') {
      res.status(200).json({ success: true, message: 'Join request already pending admin approval', requestStatus: 'pending' });
      return;
    }

    if (existingRequest?.status === 'approved') {
      res.status(200).json({ success: true, message: 'Join request already approved', requestStatus: 'approved' });
      return;
    }

    if (existingRequest) {
      await prisma.groupJoinRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: 'pending',
          reviewedById: null,
          reviewedAt: null
        }
      });
    } else {
      await prisma.groupJoinRequest.create({
        data: {
          groupId,
          requesterId: req.user.id,
          status: 'pending'
        }
      });
    }

    const actorName = await getSafeActorName(req.user.id);
    await createNotification({
      userId: group.creatorId,
      title: 'New group join request',
      message: `${actorName} requested to join ${group.name}.`,
      type: 'group_join_request',
      actionUrl: '/groups',
      metadata: { groupId, requesterId: req.user.id }
    });

    res.status(200).json({ success: true, message: 'Join request sent to admin', requestStatus: 'pending' });
    return;
  }

  if (isUserMember(group.members, req.user.id)) {
    res.status(200).json({ success: true, message: 'Already a member of this group' });
    return;
  }

  await prisma.group.update({
    where: { id: groupId },
    data: {
      members: { connect: { id: req.user.id } },
      memberCount: { increment: 1 },
      lastActivity: new Date()
    }
  });

  const actorName = await getSafeActorName(req.user.id);
  await createSystemMessage(groupId, req.user.id, `${actorName} joined the group`);

  res.status(200).json({ success: true, message: 'Joined group' });
});

export const leaveGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } }
  });

  if (!group) {
    res.status(404).json({ message: 'Group not found' });
    return;
  }

  if (group.creatorId === req.user.id) {
    const memberIds = group.members.map((member) => member.id);
    const nextAdminId = await getNextAdminCandidateId(groupId, req.user.id, memberIds);

    if (!nextAdminId) {
      await prisma.group.delete({ where: { id: groupId } });
      res.status(200).json({ success: true, message: 'Group deleted because there was no successor admin' });
      return;
    }

    const [actorName, nextAdminName] = await Promise.all([
      getSafeActorName(req.user.id),
      getSafeActorName(nextAdminId)
    ]);

    await prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: groupId },
        data: {
          creatorId: nextAdminId,
          members: { disconnect: { id: req.user!.id } },
          memberCount: { decrement: 1 },
          lastActivity: new Date()
        }
      });

      await tx.groupMessage.create({
        data: {
          groupId,
          authorId: req.user!.id,
          content: `${actorName} left the group`,
          messageType: 'system'
        }
      });

      await tx.groupMessage.create({
        data: {
          groupId,
          authorId: nextAdminId,
          content: `${nextAdminName} is now the group admin`,
          messageType: 'system'
        }
      });
    });

    await createNotification({
      userId: nextAdminId,
      title: 'You are now a group admin',
      message: `Admin rights for ${group.name} were transferred to you.`,
      type: 'group_admin_transferred',
      actionUrl: '/groups',
      metadata: { groupId }
    });

    res.status(200).json({ success: true, message: 'You left the group and admin rights were transferred' });
    return;
  }

  if (!isUserMember(group.members, req.user.id)) {
    res.status(200).json({ success: true, message: 'You are not a member of this group' });
    return;
  }

  const actorName = await getSafeActorName(req.user.id);
  await createSystemMessage(groupId, req.user.id, `${actorName} left the group`);

  await prisma.group.update({
    where: { id: groupId },
    data: {
      members: { disconnect: { id: req.user.id } },
      memberCount: { decrement: 1 },
      lastActivity: new Date()
    }
  });
  res.status(200).json({ success: true, message: 'Left group' });
});

export const getGroup = getGroupById;

export const getGroupJoinRequests = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  if (!isGroupAdmin(group, req.user.id)) {
    if (!isWatcherRole(req.user.role)) {
      res.status(403).json({ message: 'Only group admin or watchers can view join requests' });
      return;
    }
  }

  const requests = await prisma.groupJoinRequest.findMany({
    where: { groupId, status: 'pending' },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({ success: true, data: requests });
});

export const respondToGroupJoinRequest = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const requestId = req.params.requestId;
  if (!requestId) {
    res.status(400).json({ success: false, message: 'Join request id is required' });
    return;
  }
  const rawAction = req.body?.action;
  let action: 'approve' | 'reject' | null = null;
  if (rawAction === 'approve' || rawAction === 'reject') {
    action = rawAction;
  }
  if (!action) {
    res.status(400).json({ success: false, message: 'Action must be approve or reject' });
    return;
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  if (!isGroupAdmin(group, req.user.id)) {
    res.status(403).json({ message: 'Only group admin can respond to join requests' });
    return;
  }

  const joinRequest = await prisma.groupJoinRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { id: true, name: true, email: true } }
    }
  });

  if (joinRequest?.groupId !== groupId) {
    res.status(404).json({ success: false, message: 'Join request not found' });
    return;
  }

  if (joinRequest.status !== 'pending') {
    res.status(400).json({ success: false, message: 'This join request has already been processed' });
    return;
  }

  if (action === 'approve') {
    const alreadyMember = isUserMember(group.members, joinRequest.requesterId);

    await prisma.$transaction(async (tx) => {
      await tx.groupJoinRequest.update({
        where: { id: joinRequest.id },
        data: {
          status: 'approved',
          reviewedById: req.user!.id,
          reviewedAt: new Date()
        }
      });

      if (!alreadyMember) {
        await tx.group.update({
          where: { id: groupId },
          data: {
            members: { connect: { id: joinRequest.requesterId } },
            memberCount: { increment: 1 },
            lastActivity: new Date()
          }
        });

        await tx.groupMessage.create({
          data: {
            groupId,
            authorId: joinRequest.requesterId,
            content: `${joinRequest.requester.name || joinRequest.requester.email.split('@')[0]} joined the group`,
            messageType: 'system'
          }
        });
      }
    });

    await createNotification({
      userId: joinRequest.requesterId,
      title: 'Group join approved',
      message: `Your request to join ${group.name} was approved.`,
      type: 'group_join_approved',
      actionUrl: '/groups',
      metadata: { groupId }
    });

    res.status(200).json({ success: true, message: 'Join request approved' });
    return;
  }

  await prisma.groupJoinRequest.update({
    where: { id: joinRequest.id },
    data: {
      status: 'rejected',
      reviewedById: req.user.id,
      reviewedAt: new Date()
    }
  });

  await createNotification({
    userId: joinRequest.requesterId,
    title: 'Group join request declined',
    message: `Your request to join ${group.name} was declined by the group admin.`,
    type: 'group_join_rejected',
    actionUrl: '/groups',
    metadata: { groupId }
  });

  res.status(200).json({ success: true, message: 'Join request rejected' });
});

export const getUserGroups = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groups = await prisma.group.findMany({
    where: { members: { some: { id: req.user.id } } },
    include: { creator: true, members: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, data: groups });
});

export const getGroupMessages = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  const canRead =
    isWatcherRole(req.user.role) ||
    group.creatorId === req.user.id ||
    isUserMember(group.members, req.user.id);
  if (!canRead) { res.status(403).json({ message: 'Not authorized to view messages in this group' }); return; }

  const messages = await prisma.groupMessage.findMany({
    where: { groupId },
    include: { author: { select: { id: true, name: true, profileImage: true } } },
    orderBy: { createdAt: 'asc' },
    take: 100
  });
  res.status(200).json({ success: true, data: messages });
});

export const postGroupMessage = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { members: { select: { id: true } } }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  if (!isUserMember(group.members, req.user.id)) {
    res.status(403).json({ message: 'Join this group to post messages' });
    return;
  }

  const content = String(req.body?.content || '').trim();
  if (!content) { res.status(400).json({ message: 'Message content is required' }); return; }

  const message = await prisma.groupMessage.create({
    data: {
      groupId,
      authorId: req.user.id,
      content
    },
    include: { author: { select: { id: true, name: true, profileImage: true } } }
  });

  await prisma.group.update({ where: { id: groupId }, data: { lastActivity: new Date() } });

  res.status(201).json({ success: true, data: message });
});
