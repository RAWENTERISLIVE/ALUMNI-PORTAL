import { Request, Response } from 'express';
import Post from '../models/Post';

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Create a new post
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, imageUrl, visibility, tags, isSchoolUpdate } = req.body;
    const author = req.user?.id;

    if (!author) {
      res.status(400).json({ success: false, message: 'Author ID is missing.' });
      return;
    }

    const post = new Post({
      title,
      content,
      author,
      category,
      imageUrl,
      visibility,
      tags,
      isSchoolUpdate: isSchoolUpdate || false,
      isFeatured: false, // Admins can feature posts later
    });

    await post.save();
    
    // Format the response with consistent id field
    const formattedPost = {
      ...post.toObject(),
      id: post._id.toString()
    };
    
    res.status(201).json({ success: true, message: 'Post created successfully', post: formattedPost });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

// Get all posts (with pagination and filtering)
export const getAllPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      authorId, 
      category, 
      visibility, 
      tag, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      isSchoolUpdate 
    } = req.query;

    const query: any = {};
    if (authorId) query.author = authorId;
    if (category) query.category = category as string;
    if (visibility) query.visibility = visibility as string;
    if (tag) query.tags = { $in: [tag as string] };
    if (isSchoolUpdate !== undefined) query.isSchoolUpdate = isSchoolUpdate === 'true';


    const posts = await Post.find(query)
      .populate('author', 'name email profileImage') // Populate author details
      .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const totalPosts = await Post.countDocuments(query);

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: {
        ...post.author,
        id: post.author._id ? post.author._id.toString() : undefined
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts, // Changed from posts to data
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalPosts / Number(limit)),
        totalPosts,
        pages: Math.ceil(totalPosts / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// Get a single post by ID
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.postId)
                           .populate('author', 'name email profileImage')
                           .populate('comments'); // Assuming you have a Comment model and want to populate comments
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }
    
    // Format the response with consistent id field
    const formattedPost = {
      ...post.toObject(),
      id: post._id.toString(),
      author: {
        ...post.author,
        id: (post.author as any)._id ? (post.author as any)._id.toString() : undefined
      }
    };
    
    res.status(200).json({ success: true, post: formattedPost });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
  }
};

// Update a post
export const updatePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId;
    const userId = req.user?.id;
    const { title, content, category, imageUrl, visibility, tags } = req.body;

    // Find the post first
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Check if user is authorized to update (author or admin)
    if (post.author.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Unauthorized to update this post' });
      return;
    }

    // Update the post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, content, category, imageUrl, visibility, tags, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('author', 'name email profileImage');

    if (!updatedPost) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Format the response with consistent id field
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id.toString(),
      author: {
        ...updatedPost.author,
        id: (updatedPost.author as any)._id ? (updatedPost.author as any)._id.toString() : undefined
      }
    };

    res.status(200).json({ success: true, message: 'Post updated successfully', post: formattedPost });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
};

// Delete a post
export const deletePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId;
    const userId = req.user?.id;

    // Find the post first
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    // Check if user is authorized to delete (author or admin)
    if (post.author.toString() !== userId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this post' });
      return;
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};

// Like a post
export const likePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found'
      });
      return;
    }

    // Check if user already liked the post
    if (post.likes.includes(userId as any)) {
      res.status(400).json({
        success: false,
        message: 'Post already liked'
      });
      return;
    }

    // Add user to likes array
    post.likes.push(userId as any);
    await post.save();

    res.json({
      success: true,
      message: 'Post liked successfully',
      data: {
        likes: post.likes.length,
        isLiked: true
      }
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like post'
    });
  }
};

// Unlike a post
export const unlikePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({
        success: false,
        message: 'Post not found'
      });
      return;
    }

    // Check if user has liked the post
    if (!post.likes.includes(userId as any)) {
      res.status(400).json({
        success: false,
        message: 'Post not liked yet'
      });
      return;
    }

    // Remove user from likes array
    post.likes = post.likes.filter(like => like.toString() !== userId);
    await post.save();

    res.json({
      success: true,
      message: 'Post unliked successfully',
      data: {
        likes: post.likes.length,
        isLiked: false
      }
    });
  } catch (error) {
    console.error('Error unliking post:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike post'
    });
  }
};

// Toggle feature status of a post (Admin only)
export const toggleFeaturePost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found' });
      return;
    }

    post.isFeatured = !post.isFeatured;
    await post.save();

    // Populate author details and format response
    const populatedPost = await Post.findById(postId).populate('author', 'name email profileImage');
    
    const formattedPost = {
      ...populatedPost!.toObject(),
      id: populatedPost!._id.toString(),
      author: {
        ...populatedPost!.author,
        id: (populatedPost!.author as any)._id ? (populatedPost!.author as any)._id.toString() : undefined
      }
    };

    res.status(200).json({ 
      success: true, 
      message: post.isFeatured ? 'Post featured' : 'Post unfeatured', 
      post: formattedPost 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle featured status', error: error.message });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    const posts = await Post.find({ isFeatured: true })
      .populate('author', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: {
        ...post.author,
        id: post.author._id ? post.author._id.toString() : undefined
      }
    }));

    res.status(200).json({ success: true, data: formattedPosts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured posts', error: error.message });
  }
};

// Get school updates
export const getSchoolUpdates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ isSchoolUpdate: true })
      .populate('author', 'name email profileImage')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();
    
    const totalPosts = await Post.countDocuments({ isSchoolUpdate: true });

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: {
        ...post.author,
        id: post.author._id ? post.author._id.toString() : undefined
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedPosts,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalPosts / Number(limit)),
        totalPosts,
        pages: Math.ceil(totalPosts / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch school updates', error: error.message });
  }
};
