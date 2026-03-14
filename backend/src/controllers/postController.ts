import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import prisma from '../config/prisma';
import { asyncHandler } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  user?: any;
}

interface LinkedInImportPostInput {
  title?: string;
  content?: string;
  postUrl?: string;
  publishedAt?: string;
}

const postInclude = {
  author: {
    select: {
      id: true,
      name: true,
      profileImage: true,
      role: true,
      admissionYear: true
    }
  },
  reactions: {
    select: {
      userId: true,
      type: true
    }
  },
  bookmarks: {
    select: {
      id: true
    }
  },
  _count: {
    select: {
      comments: true
    }
  }
} as const;

const normalizePost = (post: any, currentUserId?: string) => ({
  ...post,
  author: {
    ...post.author,
    role: typeof post.author?.role === 'string' ? post.author.role.toLowerCase() : post.author?.role,
    classYear: post.author?.admissionYear ? Number.parseInt(post.author.admissionYear, 10) : undefined
  },
  bookmarks: (post.bookmarks || []).map((bookmarkUser: { id: string }) => bookmarkUser.id),
  commentCount: post._count?.comments ?? 0,
  shareCount: post.shareCount ?? 0,
  isLiked: currentUserId ? (post.reactions || []).some((reaction: { userId: string; type: string }) => reaction.userId === currentUserId && reaction.type === 'like') : false,
  isBookmarked: currentUserId ? (post.bookmarks || []).some((bookmarkUser: { id: string }) => bookmarkUser.id === currentUserId) : false,
});

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { content, title, category, visibility, tags, attachments, externalLinks, originalPostId, shareType } = req.body;
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!content && !attachments && !originalPostId) {
    res.status(400).json({ success: false, message: 'Content, attachments, or shared post is required' });
    return;
  }

  const newPost = await prisma.post.create({
    data: {
      content,
      title: title || null,
      category: category || 'general',
      visibility: visibility || 'public',
      tags: tags || [],
      attachments: attachments || null,
      externalLinks: externalLinks || [],
      authorId: req.user.id,
      sharedPostId: originalPostId || null,
      shareType: shareType || null
    },
    include: postInclude
  });

  const normalizedPost = normalizePost(newPost, req.user.id);
  res.status(201).json({ success: true, data: normalizedPost, post: normalizedPost });
});

export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { category, search, tags, authorId, visibility } = req.query;

  const where: any = {};
  if (category) where.category = category as string;
  if (authorId) where.authorId = authorId as string;
  if (visibility) where.visibility = visibility as string;
  if (search) where.content = { contains: search as string, mode: 'insensitive' };
  if (tags) {
    const tagsArray = (tags as string).split(',').map(t => t.trim());
    where.tags = { hasSome: tagsArray };
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
      include: postInclude
    }),
    prisma.post.count({ where })
  ]);

  const normalizedPosts = posts.map((post) => normalizePost(post));

  res.status(200).json({
    success: true,
    data: normalizedPosts,
    posts: normalizedPosts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: postInclude
  });

  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }
  res.status(200).json({ success: true, data: normalizePost(post) });
});

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }
  
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  if (post.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  const { content, title, category, visibility, tags, attachments, externalLinks } = req.body;
  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      content: content ?? post.content,
      title: title ?? post.title,
      category: category ?? post.category,
      visibility: visibility ?? post.visibility,
      tags: tags ?? post.tags,
      attachments: attachments ?? post.attachments,
      externalLinks: externalLinks ?? post.externalLinks
    },
    include: postInclude
  });

  const normalizedPost = normalizePost(updatedPost, req.user.id);
  res.status(200).json({ success: true, data: normalizedPost, post: normalizedPost });
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }
  
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  if (post.authorId !== req.user.id && req.user.role !== Role.ADMIN) {
    res.status(403).json({ success: false, message: 'Not authorized' });
    return;
  }

  await prisma.post.delete({ where: { id: postId } });
  res.status(200).json({ success: true, data: {} });
});

export const likePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const reactionType = req.body?.reactionType || 'like';

  const existingReaction = await prisma.postReaction.findUnique({
    where: { postId_userId: { postId, userId: req.user.id } }
  });

  let message = '';
  if (existingReaction) {
    if (existingReaction.type === reactionType) {
      await prisma.postReaction.delete({
        where: { postId_userId: { postId, userId: req.user.id } }
      });
      message = 'Post reaction removed';
    } else {
      await prisma.postReaction.update({
        where: { postId_userId: { postId, userId: req.user.id } },
        data: { type: reactionType }
      });
      message = 'Post reaction updated';
    }
  } else {
    await prisma.postReaction.create({ data: { postId, userId: req.user.id, type: reactionType } });
    message = 'Post reacted';
  }

  const updatedPost = await prisma.post.findUnique({
    where: { id: postId },
    include: postInclude
  });

  const normalizedPost = updatedPost ? normalizePost(updatedPost, req.user.id) : undefined;

  res.status(200).json({ success: true, message, data: normalizedPost, post: normalizedPost });
});

export const bookmarkPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const existingBookmark = await prisma.post.findFirst({
    where: {
      id: postId,
      bookmarks: {
        some: { id: req.user.id }
      }
    },
    select: { id: true }
  });

  let message = '';
  if (existingBookmark) {
    await prisma.post.update({
      where: { id: postId },
      data: { bookmarks: { disconnect: { id: req.user.id } } }
    });
    message = 'Post removed from bookmarks';
  } else {
    await prisma.post.update({
      where: { id: postId },
      data: { bookmarks: { connect: { id: req.user.id } } }
    });
    message = 'Post bookmarked';
  }

  res.status(200).json({ success: true, message });
});

export const sharePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { originalPostId, content, visibility, shareType } = req.body;
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  if (!originalPostId) {
    res.status(400).json({ success: false, message: 'Original post ID is required' });
    return;
  }

  const originalPost = await prisma.post.findUnique({ where: { id: originalPostId } });
  if (!originalPost) {
    res.status(404).json({ success: false, message: 'Original post not found' });
    return;
  }

  const newPost = await prisma.post.create({
    data: {
      content: content || '',
      visibility: visibility || 'public',
      category: 'general',
      authorId: req.user.id,
      sharedPostId: originalPostId,
      shareType: shareType || 'simple'
    },
    include: postInclude
  });

  const normalizedPost = normalizePost(newPost, req.user.id);
  await prisma.post.update({
    where: { id: originalPostId },
    data: { shareCount: { increment: 1 } }
  });

  res.status(201).json({ success: true, data: normalizedPost, post: normalizedPost });
});

export const importLinkedInPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const linkedInProfile = typeof req.body?.linkedInProfile === 'string' ? req.body.linkedInProfile.trim() : '';
  const incomingPosts: LinkedInImportPostInput[] = Array.isArray(req.body?.posts) ? req.body.posts : [];

  if (incomingPosts.length === 0) {
    res.status(400).json({ success: false, message: 'At least one LinkedIn post is required' });
    return;
  }

  const createdPosts: any[] = [];
  let skipped = 0;

  for (const rawPost of incomingPosts.slice(0, 50)) {
    const content = typeof rawPost?.content === 'string' ? rawPost.content.trim() : '';
    if (!content) {
      skipped += 1;
      continue;
    }

    const postUrl = typeof rawPost?.postUrl === 'string' ? rawPost.postUrl.trim() : '';
    const normalizedTitle = typeof rawPost?.title === 'string' ? rawPost.title.trim() : '';
    const publishedAt = typeof rawPost?.publishedAt === 'string' ? rawPost.publishedAt : undefined;
    const parsedPublishedDate = publishedAt ? new Date(publishedAt) : undefined;
    const hasValidPublishedDate = parsedPublishedDate && !Number.isNaN(parsedPublishedDate.getTime());

    const duplicatePost = await prisma.post.findFirst({
      where: {
        authorId: req.user.id,
        content,
        tags: { has: 'linkedin-import' },
        ...(postUrl ? { externalLinks: { has: postUrl } } : {})
      },
      select: { id: true }
    });

    if (duplicatePost) {
      skipped += 1;
      continue;
    }

    const createdPost = await prisma.post.create({
      data: {
        authorId: req.user.id,
        title: normalizedTitle || null,
        content,
        category: 'networking',
        visibility: 'public',
        tags: ['linkedin-import'],
        externalLinks: [
          ...new Set([postUrl, linkedInProfile].filter(Boolean))
        ],
        ...(hasValidPublishedDate ? { createdAt: parsedPublishedDate } : {})
      },
      include: postInclude
    });

    createdPosts.push(normalizePost(createdPost, req.user.id));
  }

  res.status(201).json({
    success: true,
    data: createdPosts,
    importedCount: createdPosts.length,
    skippedCount: skipped,
    message: `Imported ${createdPosts.length} LinkedIn post${createdPosts.length === 1 ? '' : 's'}`
  });
});

export const getFeedPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Simple fallback feed, returning recent posts
  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      skip, take: limit,
      include: postInclude
    }),
    prisma.post.count()
  ]);

  const normalizedPosts = posts.map((post) => normalizePost(post, req.user?.id));

  res.status(200).json({
    success: true,
    data: normalizedPosts,
    posts: normalizedPosts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getBookmarkedPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const page = Number.parseInt(req.query.page as string) || 1;
  const limit = Number.parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const posts = await prisma.post.findMany({
    where: {
      bookmarks: {
        some: { id: req.user.id }
      }
    },
    include: postInclude,
    orderBy: { createdAt: 'desc' },
    skip, take: limit
  });

  const total = await prisma.post.count({
    where: {
      bookmarks: {
        some: { id: req.user.id }
      }
    }
  });

  const normalizedPosts = posts.map((post) => normalizePost(post, req.user.id));

  res.status(200).json({
    success: true,
    data: normalizedPosts,
    posts: normalizedPosts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getFeaturedPosts = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await prisma.post.findMany({
    where: { isFeatured: true },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: postInclude
  });

  res.status(200).json({ success: true, data: posts.map((post) => normalizePost(post)) });
});

export const getSchoolUpdates = asyncHandler(async (_req: Request, res: Response) => {
  const posts = await prisma.post.findMany({
    where: { isSchoolUpdate: true },
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: postInclude
  });

  res.status(200).json({ success: true, data: posts.map((post) => normalizePost(post)) });
});

export const toggleFeaturePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { postId } = req.params;
  if (!postId) {
    res.status(400).json({ success: false, message: 'Post ID is required' });
    return;
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    res.status(404).json({ success: false, message: 'Post not found' });
    return;
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: { isFeatured: !post.isFeatured },
    include: postInclude
  });

  res.status(200).json({ success: true, data: normalizePost(updatedPost, req.user?.id) });
});
