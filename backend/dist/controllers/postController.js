"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchoolUpdates = exports.getFeaturedPosts = exports.toggleFeaturePost = exports.likePost = exports.deletePost = exports.updatePost = exports.getPostById = exports.getAllPosts = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const mongoose_1 = __importDefault(require("mongoose"));
const createPost = async (req, res) => {
    try {
        const { title, content, category, imageUrl, visibility, tags, isSchoolUpdate } = req.body;
        const author = req.user?.id;
        if (!author) {
            res.status(400).json({ success: false, message: 'Author ID is missing.' });
            return;
        }
        const post = new Post_1.default({
            title,
            content,
            author,
            category,
            imageUrl,
            visibility,
            tags,
            isSchoolUpdate: isSchoolUpdate || false,
            isFeatured: false,
        });
        await post.save();
        res.status(201).json({ success: true, message: 'Post created successfully', post });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
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
        const posts = await Post_1.default.find(query)
            .populate('author', 'name email profileImage')
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const totalPosts = await Post_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            posts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalPosts / Number(limit)),
                totalPosts,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
    }
};
exports.getAllPosts = getAllPosts;
const getPostById = async (req, res) => {
    try {
        const post = await Post_1.default.findById(req.params.postId)
            .populate('author', 'name email profileImage')
            .populate('comments');
        if (!post) {
            res.status(404).json({ success: false, message: 'Post not found' });
            return;
        }
        res.status(200).json({ success: true, post });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
    }
};
exports.getPostById = getPostById;
const updatePost = async (req, res) => {
    try {
        const { title, content, category, imageUrl, visibility, tags, isSchoolUpdate } = req.body;
        const postId = req.params.postId;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.author.toString() !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this post' });
        }
        post.title = title ?? post.title;
        post.content = content ?? post.content;
        post.category = category ?? post.category;
        post.imageUrl = imageUrl ?? post.imageUrl;
        post.visibility = visibility ?? post.visibility;
        post.tags = tags ?? post.tags;
        if (isSchoolUpdate !== undefined) {
            post.isSchoolUpdate = isSchoolUpdate;
        }
        await post.save();
        return res.status(200).json({ success: true, message: 'Post updated successfully', post });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
    }
};
exports.updatePost = updatePost;
const deletePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        if (post.author.toString() !== userId && userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this post' });
        }
        await post.deleteOne();
        return res.status(200).json({ success: true, message: 'Post deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
    }
};
exports.deletePost = deletePost;
const likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is missing.' });
        }
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const alreadyLiked = post.likes.some(like => like.equals(userObjectId));
        if (alreadyLiked) {
            post.likes = post.likes.filter(like => !like.equals(userObjectId));
        }
        else {
            post.likes.push(userObjectId);
        }
        await post.save();
        return res.status(200).json({ success: true, message: alreadyLiked ? 'Post unliked' : 'Post liked', post });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to like/unlike post', error: error.message });
    }
};
exports.likePost = likePost;
const toggleFeaturePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }
        post.isFeatured = !post.isFeatured;
        await post.save();
        return res.status(200).json({
            success: true,
            message: `Post ${post.isFeatured ? 'featured' : 'unfeatured'} successfully`,
            post
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to toggle feature status', error: error.message });
    }
};
exports.toggleFeaturePost = toggleFeaturePost;
const getFeaturedPosts = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const posts = await Post_1.default.find({ isFeatured: true })
            .populate('author', 'name email profileImage')
            .sort({ createdAt: -1 })
            .limit(Number(limit));
        res.status(200).json({ success: true, posts });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch featured posts', error: error.message });
    }
};
exports.getFeaturedPosts = getFeaturedPosts;
const getSchoolUpdates = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const posts = await Post_1.default.find({ isSchoolUpdate: true })
            .populate('author', 'name email profileImage')
            .sort({ createdAt: -1 })
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit));
        const totalPosts = await Post_1.default.countDocuments({ isSchoolUpdate: true });
        res.status(200).json({
            success: true,
            posts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(totalPosts / Number(limit)),
                totalPosts,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch school updates', error: error.message });
    }
};
exports.getSchoolUpdates = getSchoolUpdates;
//# sourceMappingURL=postController.js.map