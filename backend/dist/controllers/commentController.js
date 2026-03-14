"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.unlikeComment = exports.likeComment = exports.getCommentReplies = exports.getPostComments = exports.createComment = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const includeAuthor = {
    author: {
        select: {
            id: true,
            name: true,
            profileImage: true,
            role: true
        }
    }
};
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        const created = await prisma_1.default.comment.create({
            data: {
                content,
                authorId: userId,
                postId,
                parentCommentId: parentCommentId || null
            },
            include: includeAuthor
        });
        await prisma_1.default.post.update({
            where: { id: postId },
            data: { commentCount: { increment: 1 } }
        });
        return res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: created
        });
    }
    catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ success: false, message: 'Failed to create comment', error: error.message });
    }
};
exports.createComment = createComment;
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        const [comments, total] = await Promise.all([
            prisma_1.default.comment.findMany({
                where: { postId, parentCommentId: null },
                include: includeAuthor,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.comment.count({ where: { postId, parentCommentId: null } })
        ]);
        return res.status(200).json({
            success: true,
            data: comments,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch comments', error: error.message });
    }
};
exports.getPostComments = getPostComments;
const getCommentReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const page = Number.parseInt(req.query.page, 10) || 1;
        const limit = Number.parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const parent = await prisma_1.default.comment.findUnique({ where: { id: commentId } });
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        const [replies, total] = await Promise.all([
            prisma_1.default.comment.findMany({
                where: { parentCommentId: commentId },
                include: includeAuthor,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma_1.default.comment.count({ where: { parentCommentId: commentId } })
        ]);
        return res.status(200).json({
            success: true,
            data: replies,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching replies:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch replies', error: error.message });
    }
};
exports.getCommentReplies = getCommentReplies;
const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            include: { likes: { select: { id: true } } }
        });
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        if (comment.likes.some((likeUser) => likeUser.id === userId)) {
            return res.status(400).json({ success: false, message: 'You have already liked this comment' });
        }
        const updated = await prisma_1.default.comment.update({
            where: { id: commentId },
            data: { likes: { connect: { id: userId } } },
            include: { likes: { select: { id: true } } }
        });
        return res.status(200).json({
            success: true,
            message: 'Comment liked successfully',
            data: { likeCount: updated.likes.length }
        });
    }
    catch (error) {
        console.error('Error liking comment:', error);
        return res.status(500).json({ success: false, message: 'Failed to like comment', error: error.message });
    }
};
exports.likeComment = likeComment;
const unlikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const comment = await prisma_1.default.comment.findUnique({
            where: { id: commentId },
            include: { likes: { select: { id: true } } }
        });
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        if (!comment.likes.some((likeUser) => likeUser.id === userId)) {
            return res.status(400).json({ success: false, message: 'You have not liked this comment' });
        }
        const updated = await prisma_1.default.comment.update({
            where: { id: commentId },
            data: { likes: { disconnect: { id: userId } } },
            include: { likes: { select: { id: true } } }
        });
        return res.status(200).json({
            success: true,
            message: 'Comment unliked successfully',
            data: { likeCount: updated.likes.length }
        });
    }
    catch (error) {
        console.error('Error unliking comment:', error);
        return res.status(500).json({ success: false, message: 'Failed to unlike comment', error: error.message });
    }
};
exports.unlikeComment = unlikeComment;
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id || req.user?._id;
        const userRole = (req.user?.role || '').toLowerCase();
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const comment = await prisma_1.default.comment.findUnique({ where: { id: commentId } });
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }
        const isAuthor = comment.authorId === userId;
        const isAdmin = userRole === 'admin' || userRole === 'super_admin';
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment' });
        }
        const repliesCount = await prisma_1.default.comment.count({ where: { parentCommentId: commentId } });
        await prisma_1.default.comment.deleteMany({ where: { OR: [{ id: commentId }, { parentCommentId: commentId }] } });
        await prisma_1.default.post.update({
            where: { id: comment.postId },
            data: { commentCount: { decrement: repliesCount + 1 } }
        });
        return res.status(200).json({ success: true, message: 'Comment deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete comment', error: error.message });
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=commentController.js.map