"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFeaturePost = exports.getSchoolUpdates = exports.getFeaturedPosts = exports.getBookmarkedPosts = exports.getFeedPosts = exports.sharePost = exports.bookmarkPost = exports.likePost = exports.deletePost = exports.updatePost = exports.getPostById = exports.getAllPosts = exports.createPost = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const errorHandler_1 = require("../middleware/errorHandler");
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
};
const normalizePost = (post, currentUserId) => ({
    ...post,
    author: {
        ...post.author,
        role: typeof post.author?.role === 'string' ? post.author.role.toLowerCase() : post.author?.role,
        classYear: post.author?.admissionYear ? Number.parseInt(post.author.admissionYear, 10) : undefined
    },
    bookmarks: (post.bookmarks || []).map((bookmarkUser) => bookmarkUser.id),
    commentCount: post._count?.comments ?? 0,
    shareCount: post.shareCount ?? 0,
    isLiked: currentUserId ? (post.reactions || []).some((reaction) => reaction.userId === currentUserId && reaction.type === 'like') : false,
    isBookmarked: currentUserId ? (post.bookmarks || []).some((bookmarkUser) => bookmarkUser.id === currentUserId) : false,
});
exports.createPost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { content, title, category, visibility, tags, attachments, externalLinks, originalPostId, shareType } = req.body;
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!content && !attachments && !originalPostId) {
        res.status(400).json({ success: false, message: 'Content, attachments, or shared post is required' });
        return;
    }
    const newPost = await prisma_1.default.post.create({
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
exports.getAllPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { category, search, tags, authorId, visibility } = req.query;
    const where = {};
    if (category)
        where.category = category;
    if (authorId)
        where.authorId = authorId;
    if (visibility)
        where.visibility = visibility;
    if (search)
        where.content = { contains: search, mode: 'insensitive' };
    if (tags) {
        const tagsArray = tags.split(',').map(t => t.trim());
        where.tags = { hasSome: tagsArray };
    }
    const [posts, total] = await Promise.all([
        prisma_1.default.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
            include: postInclude
        }),
        prisma_1.default.post.count({ where })
    ]);
    const normalizedPosts = posts.map((post) => normalizePost(post));
    res.status(200).json({
        success: true,
        data: normalizedPosts,
        posts: normalizedPosts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getPostById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ success: false, message: 'Post ID is required' });
        return;
    }
    const post = await prisma_1.default.post.findUnique({
        where: { id: postId },
        include: postInclude
    });
    if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
    }
    res.status(200).json({ success: true, data: normalizePost(post) });
});
exports.updatePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ success: false, message: 'Post ID is required' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
    if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
    }
    if (post.authorId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    const { content, title, category, visibility, tags, attachments, externalLinks } = req.body;
    const updatedPost = await prisma_1.default.post.update({
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
exports.deletePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ success: false, message: 'Post ID is required' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
    if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
    }
    if (post.authorId !== req.user.id && req.user.role !== client_1.Role.ADMIN) {
        res.status(403).json({ success: false, message: 'Not authorized' });
        return;
    }
    await prisma_1.default.post.delete({ where: { id: postId } });
    res.status(200).json({ success: true, data: {} });
});
exports.likePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
    const existingReaction = await prisma_1.default.postReaction.findUnique({
        where: { postId_userId: { postId, userId: req.user.id } }
    });
    let message = '';
    if (existingReaction) {
        if (existingReaction.type === reactionType) {
            await prisma_1.default.postReaction.delete({
                where: { postId_userId: { postId, userId: req.user.id } }
            });
            message = 'Post reaction removed';
        }
        else {
            await prisma_1.default.postReaction.update({
                where: { postId_userId: { postId, userId: req.user.id } },
                data: { type: reactionType }
            });
            message = 'Post reaction updated';
        }
    }
    else {
        await prisma_1.default.postReaction.create({ data: { postId, userId: req.user.id, type: reactionType } });
        message = 'Post reacted';
    }
    const updatedPost = await prisma_1.default.post.findUnique({
        where: { id: postId },
        include: postInclude
    });
    const normalizedPost = updatedPost ? normalizePost(updatedPost, req.user.id) : undefined;
    res.status(200).json({ success: true, message, data: normalizedPost, post: normalizedPost });
});
exports.bookmarkPost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ success: false, message: 'Post ID is required' });
        return;
    }
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const existingBookmark = await prisma_1.default.post.findFirst({
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
        await prisma_1.default.post.update({
            where: { id: postId },
            data: { bookmarks: { disconnect: { id: req.user.id } } }
        });
        message = 'Post removed from bookmarks';
    }
    else {
        await prisma_1.default.post.update({
            where: { id: postId },
            data: { bookmarks: { connect: { id: req.user.id } } }
        });
        message = 'Post bookmarked';
    }
    res.status(200).json({ success: true, message });
});
exports.sharePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { originalPostId, content, visibility, shareType } = req.body;
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    if (!originalPostId) {
        res.status(400).json({ success: false, message: 'Original post ID is required' });
        return;
    }
    const originalPost = await prisma_1.default.post.findUnique({ where: { id: originalPostId } });
    if (!originalPost) {
        res.status(404).json({ success: false, message: 'Original post not found' });
        return;
    }
    const newPost = await prisma_1.default.post.create({
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
    await prisma_1.default.post.update({
        where: { id: originalPostId },
        data: { shareCount: { increment: 1 } }
    });
    res.status(201).json({ success: true, data: normalizedPost, post: normalizedPost });
});
exports.getFeedPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
        prisma_1.default.post.findMany({
            orderBy: { createdAt: 'desc' },
            skip, take: limit,
            include: postInclude
        }),
        prisma_1.default.post.count()
    ]);
    const normalizedPosts = posts.map((post) => normalizePost(post, req.user?.id));
    res.status(200).json({
        success: true,
        data: normalizedPosts,
        posts: normalizedPosts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
});
exports.getBookmarkedPosts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
    }
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const posts = await prisma_1.default.post.findMany({
        where: {
            bookmarks: {
                some: { id: req.user.id }
            }
        },
        include: postInclude,
        orderBy: { createdAt: 'desc' },
        skip, take: limit
    });
    const total = await prisma_1.default.post.count({
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
exports.getFeaturedPosts = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const posts = await prisma_1.default.post.findMany({
        where: { isFeatured: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: postInclude
    });
    res.status(200).json({ success: true, data: posts.map((post) => normalizePost(post)) });
});
exports.getSchoolUpdates = (0, errorHandler_1.asyncHandler)(async (_req, res) => {
    const posts = await prisma_1.default.post.findMany({
        where: { isSchoolUpdate: true },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: postInclude
    });
    res.status(200).json({ success: true, data: posts.map((post) => normalizePost(post)) });
});
exports.toggleFeaturePost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { postId } = req.params;
    if (!postId) {
        res.status(400).json({ success: false, message: 'Post ID is required' });
        return;
    }
    const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
    if (!post) {
        res.status(404).json({ success: false, message: 'Post not found' });
        return;
    }
    const updatedPost = await prisma_1.default.post.update({
        where: { id: postId },
        data: { isFeatured: !post.isFeatured },
        include: postInclude
    });
    res.status(200).json({ success: true, data: normalizePost(updatedPost, req.user?.id) });
});
//# sourceMappingURL=postController.js.map