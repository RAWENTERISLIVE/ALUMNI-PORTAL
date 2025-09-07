"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.unlikeComment = exports.likeComment = exports.getCommentReplies = exports.getPostComments = exports.createComment = void 0;
const Comment_1 = __importDefault(require("../models/Comment"));
const Post_1 = __importDefault(require("../models/Post"));
const PostModel = Post_1.default;
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.user?.id ?? req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        const newComment = new Comment_1.default({
            content,
            author: userId,
            post: postId,
            ...(parentCommentId && { parentComment: parentCommentId })
        });
        const savedComment = await newComment.save();
        post.commentCount = (post.commentCount ?? 0) + 1;
        await post.save();
        const populatedComment = await Comment_1.default.findById(savedComment._id)
            .populate('author', 'name profileImage role');
        return res.status(201).json({
            success: true,
            message: 'Comment added successfully',
            data: populatedComment
        });
    }
    catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create comment',
            error: error.message
        });
    }
};
exports.createComment = createComment;
const getPostComments = async (req, res) => {
    try {
        const { postId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        const comments = await Comment_1.default.find({ post: postId, parentComment: { $exists: false } })
            .populate('author', 'name profileImage role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Comment_1.default.countDocuments({ post: postId, parentComment: { $exists: false } });
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
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch comments',
            error: error.message
        });
    }
};
exports.getPostComments = getPostComments;
const getCommentReplies = async (req, res) => {
    try {
        const { commentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const comment = await Comment_1.default.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        const replies = await Comment_1.default.find({ parentComment: commentId })
            .populate('author', 'name profileImage role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Comment_1.default.countDocuments({ parentComment: commentId });
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
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch replies',
            error: error.message
        });
    }
};
exports.getCommentReplies = getCommentReplies;
const likeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id ?? req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const comment = await Comment_1.default.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        const alreadyLiked = comment.likes.includes(userId);
        if (alreadyLiked) {
            return res.status(400).json({
                success: false,
                message: 'You have already liked this comment'
            });
        }
        comment.likes.push(userId);
        await comment.save();
        return res.status(200).json({
            success: true,
            message: 'Comment liked successfully',
            data: {
                likeCount: comment.likes.length
            }
        });
    }
    catch (error) {
        console.error('Error liking comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to like comment',
            error: error.message
        });
    }
};
exports.likeComment = likeComment;
const unlikeComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id ?? req.user?._id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const comment = await Comment_1.default.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        const likeIndex = comment.likes.findIndex(like => like.toString() === userId.toString());
        if (likeIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'You have not liked this comment'
            });
        }
        comment.likes.splice(likeIndex, 1);
        await comment.save();
        return res.status(200).json({
            success: true,
            message: 'Comment unliked successfully',
            data: {
                likeCount: comment.likes.length
            }
        });
    }
    catch (error) {
        console.error('Error unliking comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unlike comment',
            error: error.message
        });
    }
};
exports.unlikeComment = unlikeComment;
const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.id ?? req.user?._id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        const comment = await Comment_1.default.findById(commentId);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }
        const isAuthor = comment.author.toString() === userId.toString();
        const isAdmin = userRole === 'admin';
        if (!isAuthor && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this comment'
            });
        }
        await PostModel.findByIdAndUpdate(comment.post, {
            $inc: { commentCount: -1 }
        });
        await Comment_1.default.findByIdAndDelete(commentId);
        const deletedReplies = await Comment_1.default.deleteMany({ parentComment: commentId });
        if (deletedReplies.deletedCount > 0) {
            await PostModel.findByIdAndUpdate(comment.post, {
                $inc: { commentCount: -deletedReplies.deletedCount }
            });
        }
        return res.status(200).json({
            success: true,
            message: 'Comment deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete comment',
            error: error.message
        });
    }
};
exports.deleteComment = deleteComment;
//# sourceMappingURL=commentController.js.map