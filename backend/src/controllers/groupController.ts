import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: { id: string };
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

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { privacy: 'public' },
        { creatorId: req.user.id },
        { members: { some: { id: req.user.id } } }
      ]
    },
    include: { creator: true, members: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, data: groups });
});

export const getGroupById = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }

  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { creator: true, members: true, messages: { take: 20, orderBy: { createdAt: 'desc' } } }
  });
  if (!group) { res.status(404).json({ message: 'Group not found' }); return; }

  const canAccess = group.privacy !== 'private' || group.creatorId === req.user.id || isUserMember(group.members, req.user.id);
  if (!canAccess) { res.status(403).json({ message: 'Not authorized to access this group' }); return; }

  res.status(200).json({ success: true, data: group });
});

export const updateGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.creatorId !== req.user?.id) { res.status(403).json({ message: 'Not authorized' }); return; }
  const updated = await prisma.group.update({ where: { id: groupId }, data: req.body, include: { creator: true, members: true } });
  res.status(200).json({ success: true, data: updated });
});

export const deleteGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.creatorId !== req.user?.id) { res.status(403).json({ message: 'Not authorized' }); return; }
  await prisma.group.delete({ where: { id: groupId } });
  res.status(200).json({ success: true, message: 'Group deleted' });
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
    res.status(403).json({ success: false, message: 'Private groups require an invitation to join' });
    return;
  }

  if (isUserMember(group.members, req.user.id)) {
    res.status(200).json({ success: true, message: 'Already a member of this group' });
    return;
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { members: { connect: { id: req.user.id } } }
  });
  res.status(200).json({ success: true, message: 'Joined group' });
});

export const leaveGroup = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ message: 'Not authenticated' }); return; }
  const groupId = getRequiredGroupId(req, res);
  if (!groupId) return;

  await prisma.group.update({
    where: { id: groupId },
    data: { members: { disconnect: { id: req.user.id } } }
  });
  res.status(200).json({ success: true, message: 'Left group' });
});

export const getGroup = getGroupById;

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

  const canRead = group.privacy !== 'private' || group.creatorId === req.user.id || isUserMember(group.members, req.user.id);
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
