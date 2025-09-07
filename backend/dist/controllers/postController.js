"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleFeaturePost = exports.getSchoolUpdates = exports.getFeaturedPosts = exports.getBookmarkedPosts = exports.getFeedPosts = exports.sharePost = exports.bookmarkPost = exports.likePost = exports.deletePost = exports.updatePost = exports.getPostById = exports.getAllPosts = exports.createPost = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Post_1 = __importDefault(require("../models/Post"));
const User_1 = __importDefault(require("../models/User"));
const PostModel = Post_1.default;
const UserModel = User_1.default;
const isIdInArray = (idArray, idToCheck) => {
    if (!idArray?.length)
        return false;
    const idToCheckStr = idToCheck.toString();
    return idArray.some(id => id && id.toString() === idToCheckStr);
};
const toObjectId = (id) => {
    return typeof id === 'string' ? new mongoose_1.default.Types.ObjectId(id) : id;
};
const createPost = async (req, res) => {
    try {
        const { title, content, category, visibility, tags, isSchoolUpdate, externalLinks, mentions } = req.body;
        if (!req.user?._id) {
            return res.status(400).json({ success: false, message: 'Author ID is missing.' });
        }
        const author = req.user._id;
        const postData = {
            title: title?.trim(),
            content: content.trim(),
            author,
            category: category ?? 'general',
            visibility: visibility ?? 'public',
            tags: tags ?? [],
            isSchoolUpdate: isSchoolUpdate ?? false,
            isFeatured: false,
            externalLinks: externalLinks ?? [],
            mentions: mentions ?? []
        };
        const post = new Post_1.default(postData);
        await post.save();
        const populatedPost = await PostModel.findById(post._id)
            .populate('author', 'name email profileImage role classYear')
            .populate('mentions', 'name email profileImage')
            .lean();
        const formattedPost = {
            ...populatedPost,
            id: populatedPost?._id.toString(),
            author: populatedPost?.author ? {
                ...populatedPost.author,
                id: populatedPost.author._id.toString()
            } : undefined
        };
        return res.status(201).json({
            success: true,
            message: 'Post created successfully',
            post: formattedPost
        });
    }
    catch (error) {
        console.error('Create post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create post',
            error: error.message
        });
    }
};
exports.createPost = createPost;
const getAllPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, authorId, category, visibility, tag, sortBy = 'createdAt', sortOrder = 'desc', isSchoolUpdate } = req.query;
        const query = {};
        if (authorId)
            query.author = authorId;
        if (category)
            query.category = category;
        if (visibility)
            query.visibility = visibility;
        if (tag)
            query.tags = { $in: [tag] };
        if (isSchoolUpdate !== undefined)
            query.isSchoolUpdate = isSchoolUpdate === 'true';
        const posts = await PostModel.find(query)
            .populate('author', 'name email profileImage role classYear')
            .populate('mentions', 'name email profileImage')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();
        const totalPosts = await PostModel.countDocuments(query);
        const formattedPosts = posts.map(post => ({
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id.toString()
            } : undefined,
            mentions: post.mentions ? post.mentions.map((user) => ({
                ...user,
                id: user._id.toString()
            })) : []
        }));
        return res.status(200).json({
            success: true,
            data: formattedPosts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalPosts / Number(limit)),
                totalPosts,
                pages: Math.ceil(totalPosts / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get all posts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch posts',
            error: error.message
        });
    }
};
exports.getAllPosts = getAllPosts;
const getPostById = async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.postId)
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .populate('comments')
            .lean();
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        const formattedPost = {
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id.toString()
            } : undefined
        };
        return res.status(200).json({ success: true, post: formattedPost });
    }
    catch (error) {
        console.error('Get post by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch post',
            error: error.message
        });
    }
};
exports.getPostById = getPostById;
const updatePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        const { title, content, category, visibility, tags, externalLinks } = req.body;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
        }
        const updatedPost = await Post_1.default.findByIdAndUpdate(postId, {
            title: title?.trim() ?? undefined,
            content: content.trim(),
            category,
            visibility,
            tags: tags ?? [],
            externalLinks: externalLinks ?? []
        }, { new: true, runValidators: true })
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .lean();
        if (!updatedPost) {
            return res.status(404).json({ success: false, message: 'Post not found after update' });
        }
        return res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: {
                ...updatedPost,
                id: updatedPost._id.toString(),
                author: updatedPost.author ? {
                    ...updatedPost.author,
                    id: updatedPost.author._id?.toString()
                } : undefined
            }
        });
    }
    catch (error) {
        console.error('Update post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update post',
            error: error.message
        });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }
        await Post_1.default.findByIdAndDelete(postId);
        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    }
    catch (error) {
        console.error('Delete post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete post',
            error: error.message
        });
    }
};
exports.deletePost = deletePost;
const likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        const { reactionType = 'like' } = req.body;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        post.reactions ?? (post.reactions = []);
        const existingReactionIndex = post.reactions.findIndex(reaction => reaction.userId.toString() === userId.toString());
        if (existingReactionIndex !== -1) {
            const existingReaction = post.reactions[existingReactionIndex];
            if (existingReaction?.type === reactionType) {
                post.reactions.splice(existingReactionIndex, 1);
            }
            else if (existingReaction) {
                existingReaction.type = reactionType;
            }
        }
        else {
            post.reactions.push({
                userId: toObjectId(userId),
                type: reactionType
            });
        }
        await post.save();
        const updatedPost = await Post_1.default.findById(postId)
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .lean();
        if (!updatedPost) {
            return res.status(404).json({ success: false, message: 'Post not found after update' });
        }
        return res.status(200).json({
            success: true,
            message: 'Reaction updated successfully',
            post: {
                ...updatedPost,
                id: updatedPost._id.toString(),
                author: updatedPost.author ? {
                    ...updatedPost.author,
                    id: updatedPost.author._id?.toString()
                } : undefined
            }
        });
    }
    catch (error) {
        console.error('Like post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update reaction',
            error: error.message
        });
    }
};
exports.likePost = likePost;
const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        post.bookmarks ?? (post.bookmarks = []);
        const alreadyBookmarked = isIdInArray(post.bookmarks, userId);
        if (req.method === 'DELETE' || alreadyBookmarked) {
            post.bookmarks = post.bookmarks.filter(id => id.toString() !== userId.toString());
            await post.save();
            return res.status(200).json({
                success: true,
                message: 'Post unbookmarked successfully',
                isBookmarked: false
            });
        }
        else {
            post.bookmarks.push(toObjectId(userId));
            await post.save();
            return res.status(200).json({
                success: true,
                message: 'Post bookmarked successfully',
                isBookmarked: true
            });
        }
    }
    catch (error) {
        console.error('Bookmark post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to bookmark post',
            error: error.message
        });
    }
};
exports.bookmarkPost = bookmarkPost;
const sharePost = async (req, res) => {
    try {
        const { originalPostId, content, visibility, shareType = 'simple' } = req.body;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        const originalPost = await Post_1.default.findById(originalPostId);
        if (!originalPost) {
            return res.status(404).json({ success: false, message: 'Original post not found' });
        }
        const sharedPost = new Post_1.default({
            author: userId,
            content: content ?? '',
            visibility: visibility ?? 'public',
            sharedPost: originalPostId,
            shareType,
            category: 'general'
        });
        await sharedPost.save();
        originalPost.shareCount = (originalPost.shareCount ?? 0) + 1;
        await originalPost.save();
        const formattedPost = {
            ...sharedPost.toObject(),
            id: sharedPost._id.toString()
        };
        return res.status(201).json({
            success: true,
            message: 'Post shared successfully',
            post: formattedPost
        });
    }
    catch (error) {
        console.error('Share post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to share post',
            error: error.message
        });
    }
};
exports.sharePost = sharePost;
const getFeedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10, filter } = req.query;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const userId = req.user._id;
        let query = {};
        if (filter === 'me') {
            query.author = userId;
        }
        else if (filter === 'connections') {
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const connections = user.connections || [];
            query.author = { $in: [userId, ...connections] };
        }
        else {
            const user = await User_1.default.findById(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            const connections = user.connections || [];
            query = {
                $or: [
                    { visibility: 'public' },
                    { author: userId },
                    { visibility: 'connections_only', author: { $in: connections } }
                ]
            };
        }
        const posts = await Post_1.default.find(query)
            .populate('author', 'name email profileImage role classYear')
            .populate('mentions', 'name email profileImage')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();
        const totalPosts = await Post_1.default.countDocuments(query);
        const formattedPosts = posts.map(post => ({
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id?.toString()
            } : undefined,
            mentions: post.mentions ? post.mentions.map((user) => ({
                ...user,
                id: user._id?.toString()
            })) : [],
            isLiked: post.reactions ? post.reactions.some((reaction) => reaction.userId && reaction.userId.toString() === userId.toString() && reaction.type === 'like') : false,
            isBookmarked: post.bookmarks ? isIdInArray(post.bookmarks, userId) : false
        }));
        return res.status(200).json({
            success: true,
            data: formattedPosts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalPosts / Number(limit)),
                totalPosts,
                pages: Math.ceil(totalPosts / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Get feed posts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user timeline',
            error: error.message
        });
    }
};
exports.getFeedPosts = getFeedPosts;
const getBookmarkedPosts = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        const userId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const posts = await Post_1.default.find({
            bookmarks: { $elemMatch: { $eq: userId } }
        })
            .populate('author', 'name profileImage role classYear email')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const total = await Post_1.default.countDocuments({
            bookmarks: { $elemMatch: { $eq: userId } }
        });
        const formattedPosts = posts.map(post => ({
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id?.toString()
            } : undefined,
            isLiked: post.reactions ? post.reactions.some((reaction) => reaction.userId && reaction.userId.toString() === userId.toString() && reaction.type === 'like') : false,
            isBookmarked: true
        }));
        return res.status(200).json({
            success: true,
            data: formattedPosts,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalPosts: total
            }
        });
    }
    catch (error) {
        console.error('Get bookmarked posts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch bookmarked posts',
            error: error.message
        });
    }
};
exports.getBookmarkedPosts = getBookmarkedPosts;
const getFeaturedPosts = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const posts = await Post_1.default.find({ isFeatured: true })
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();
        const formattedPosts = posts.map(post => ({
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id?.toString()
            } : undefined
        }));
        return res.status(200).json({ success: true, data: formattedPosts });
    }
    catch (error) {
        console.error('Get featured posts error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch featured posts',
            error: error.message
        });
    }
};
exports.getFeaturedPosts = getFeaturedPosts;
const getSchoolUpdates = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const posts = await Post_1.default.find({ isSchoolUpdate: true })
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .lean();
        const formattedPosts = posts.map(post => ({
            ...post,
            id: post._id.toString(),
            author: post.author ? {
                ...post.author,
                id: post.author._id?.toString()
            } : undefined
        }));
        const total = await Post_1.default.countDocuments({ isSchoolUpdate: true });
        return res.status(200).json({
            success: true,
            data: formattedPosts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalPosts: total,
                pages: Math.ceil(total / Number(limit)),
            }
        });
    }
    catch (error) {
        console.error('Get school updates error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch school updates',
            error: error.message
        });
    }
};
exports.getSchoolUpdates = getSchoolUpdates;
const toggleFeaturePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Only administrators can feature posts' });
        }
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        post.isFeatured = !post.isFeatured;
        await post.save();
        const updatedPost = await Post_1.default.findById(postId)
            .populate('author', 'name email profileImage role classYear')
            .populate({
            path: 'sharedPost',
            populate: {
                path: 'author',
                select: 'name profileImage role classYear email'
            }
        })
            .lean();
        if (!updatedPost) {
            return res.status(404).json({ success: false, message: 'Post not found after update' });
        }
        const formattedPost = {
            ...updatedPost,
            id: updatedPost._id.toString(),
            author: updatedPost.author ? {
                ...updatedPost.author,
                id: updatedPost.author._id?.toString()
            } : undefined
        };
        return res.status(200).json({
            success: true,
            message: post.isFeatured ? 'Post featured' : 'Post unfeatured',
            post: formattedPost
        });
    }
    catch (error) {
        console.error('Toggle feature post error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to toggle featured status',
            error: error.message
        });
    }
};
exports.toggleFeaturePost = toggleFeaturePost;
//# sourceMappingURL=postController.js.map