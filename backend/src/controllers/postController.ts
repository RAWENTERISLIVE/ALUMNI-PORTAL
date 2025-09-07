/* eslint-disable @typescript-eslint/no-explicit-any */
// Mongoose 8.x has complex union types causing TypeScript issues
// Using any for Mongoose methods until types are resolved
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Type assertion to work around mongoose type issues
const PostModel = Post as any;
const UserModel = User as any;

// Helper function to safely check if an ID is in an array
const isIdInArray = (idArray: mongoose.Types.ObjectId[], idToCheck: string | mongoose.Types.ObjectId): boolean => {
  if (!idArray?.length) return false;
  const idToCheckStr = idToCheck.toString();
  return idArray.some(id => id && id.toString() === idToCheckStr);
};

// Helper function to safely convert string ID to ObjectId
const toObjectId = (id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId => {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
};

// Create a new post
export const createPost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { 
      title, 
      content, 
      category, 
      visibility, 
      tags,
      isSchoolUpdate, 
      externalLinks,
      mentions 
    } = req.body;
    
    if (!req.user?._id) {
      return res.status(400).json({ success: false, message: 'Author ID is missing.' });
    }
    
    const author = req.user._id;

    // Build post object
    const postData: any = {
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

    const post = new Post(postData);
    await post.save();
    
    // Populate the post for response
    const populatedPost = await PostModel.findById(post._id)
      .populate('author', 'name email profileImage role classYear')
      .populate('mentions', 'name email profileImage')
      .lean();
    
    // Format the response with consistent id field
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
  } catch (error: any) {
    console.error('Create post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create post', 
      error: error.message 
    });
  }
};

// Get all posts (with pagination and filtering)
export const getAllPosts = async (req: Request, res: Response): Promise<any> => {
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
    if (authorId) query.author = authorId as string;
    if (category) query.category = category as string;
    if (visibility) query.visibility = visibility as string;
    if (tag) query.tags = { $in: [tag as string] };
    if (isSchoolUpdate !== undefined) query.isSchoolUpdate = isSchoolUpdate === 'true';

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
      .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const totalPosts = await PostModel.countDocuments(query);

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id.toString()
      } : undefined,
      mentions: post.mentions ? (post.mentions as any[]).map((user: any) => ({
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
  } catch (error: any) {
    console.error('Get all posts error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch posts', 
      error: error.message 
    });
  }
};

// Get a single post by ID
export const getPostById = async (req: Request, res: Response): Promise<any> => {
  try {
    const post = await (Post.findById as any)(req.params.postId)
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
    
    // Format the response with consistent id field
    const formattedPost = {
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id.toString()
      } : undefined
    };
    
    return res.status(200).json({ success: true, post: formattedPost });
  } catch (error: any) {
    console.error('Get post by ID error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch post', 
      error: error.message 
    });
  }
};

// Update a post
export const updatePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;
    const { title, content, category, visibility, tags, externalLinks } = req.body;

    // Find the post first
    const post = await (Post.findById as any)(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the user is the author or an admin
    if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    // Update the post with new values
    const updatedPost = await (Post.findByIdAndUpdate as any)(
      postId,
      { 
        title: title?.trim() ?? undefined, 
        content: content.trim(), 
        category, 
        visibility, 
        tags: tags ?? [],
        externalLinks: externalLinks ?? []
      },
      { new: true, runValidators: true }
    )
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
  } catch (error: any) {
    console.error('Update post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update post', 
      error: error.message 
    });
  }
};

// Delete a post
export const deletePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the post
    const post = await (Post.findById as any)(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the user is the author or an admin
    if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await (Post.findByIdAndDelete as any)(postId);
    
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    console.error('Delete post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete post', 
      error: error.message 
    });
  }
};

// Like or unlike a post
export const likePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;
    const { reactionType = 'like' } = req.body;

    // Find the post
    const post = await (Post.findById as any)(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Initialize reactions array if it doesn't exist
    post.reactions ??= [];

    // Check if the user has already reacted
    const existingReactionIndex = post.reactions.findIndex(
      reaction => reaction.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      // If reaction type is the same, remove it (unlike/unreact)
      const existingReaction = post.reactions[existingReactionIndex];
      if (existingReaction?.type === reactionType) {
        post.reactions.splice(existingReactionIndex, 1);
      } else if (existingReaction) {
        // Otherwise, update the reaction type
        existingReaction.type = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({ 
        userId: toObjectId(userId), 
        type: reactionType
      });
    }

    await post.save();

    // Get updated post with populated fields
    const updatedPost = await (Post.findById as any)(postId)
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
  } catch (error: any) {
    console.error('Like post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update reaction', 
      error: error.message 
    });
  }
};

// Bookmark a post
export const bookmarkPost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the post
    const post = await (Post.findById as any)(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Initialize bookmarks array if it doesn't exist
    post.bookmarks ??= [];

    // Check if the post is already bookmarked by this user
    const alreadyBookmarked = isIdInArray(post.bookmarks, userId);
    
    // For DELETE request, always remove the bookmark
    // For POST request, toggle the bookmark status
    if (req.method === 'DELETE' || alreadyBookmarked) {
      // Remove the bookmark
      post.bookmarks = post.bookmarks.filter(id => id.toString() !== userId.toString());
      await post.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Post unbookmarked successfully', 
        isBookmarked: false
      });
    } else {
      // Add the bookmark (only for POST requests)
      post.bookmarks.push(toObjectId(userId));
      await post.save();
      return res.status(200).json({ 
        success: true, 
        message: 'Post bookmarked successfully', 
        isBookmarked: true 
      });
    }
  } catch (error: any) {
    console.error('Bookmark post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to bookmark post', 
      error: error.message 
    });
  }
};

// Share a post
export const sharePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { originalPostId, content, visibility, shareType = 'simple' } = req.body;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the original post
    const originalPost = await (Post.findById as any)(originalPostId);
    
    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Original post not found' });
    }

    // Create a new post that shares the original
    const sharedPost = new Post({
      author: userId,
      content: content ?? '',
      visibility: visibility ?? 'public',
      sharedPost: originalPostId,
      shareType,
      category: 'general'
    });

    await sharedPost.save();

    // Increment the share count of the original post
    originalPost.shareCount = (originalPost.shareCount ?? 0) + 1;
    await originalPost.save();
    
    // Format the response with consistent id field
    const formattedPost = {
      ...sharedPost.toObject(),
      id: sharedPost._id.toString()
    };
    
    return res.status(201).json({ 
      success: true, 
      message: 'Post shared successfully',
      post: formattedPost 
    });
  } catch (error: any) {
    console.error('Share post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to share post', 
      error: error.message 
    });
  }
};

// Get user's feed posts
export const getFeedPosts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10, filter } = req.query;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;
    let query: any = {};
    
    if (filter === 'me') {
      // Only posts created by the current user
      query.author = userId;
    } else if (filter === 'connections') {
      // Get the user's connections
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      const connections = user.connections || [];
      // Posts from the user and their connections
      query.author = { $in: [userId, ...connections] };
    } else {
      // Default: posts visible to the user
      const user = await User.findById(userId);
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

    const posts = await (Post.find as any)(query)
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

    const totalPosts = await Post.countDocuments(query);

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id?.toString()
      } : undefined,
      mentions: post.mentions ? (post.mentions as any[]).map((user: any) => ({
        ...user,
        id: user._id?.toString()
      })) : [],
      isLiked: post.reactions ? post.reactions.some((reaction: any) => 
        reaction.userId && reaction.userId.toString() === userId.toString() && reaction.type === 'like'
      ) : false,
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
  } catch (error: any) {
    console.error('Get feed posts error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user timeline', 
      error: error.message 
    });
  }
};

// Get bookmarked posts
export const getBookmarkedPosts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const userId = req.user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Find posts that the current user has bookmarked
    const posts = await (Post.find as any)({
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

    const total = await Post.countDocuments({
      bookmarks: { $elemMatch: { $eq: userId } }
    });

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id?.toString()
      } : undefined,
      isLiked: post.reactions ? post.reactions.some((reaction: any) =>
        reaction.userId && reaction.userId.toString() === userId.toString() && reaction.type === 'like'
      ) : false,
      isBookmarked: true // Since we're specifically querying for bookmarked posts
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
  } catch (error: any) {
    console.error('Get bookmarked posts error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookmarked posts', 
      error: error.message 
    });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await (Post.find as any)({ isFeatured: true })
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

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id?.toString()
      } : undefined
    }));

    return res.status(200).json({ success: true, data: formattedPosts });
  } catch (error: any) {
    console.error('Get featured posts error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch featured posts', 
      error: error.message 
    });
  }
};

// Get school updates
export const getSchoolUpdates = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await (Post.find as any)({ isSchoolUpdate: true })
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

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id?.toString()
      } : undefined
    }));

    const total = await Post.countDocuments({ isSchoolUpdate: true });

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
  } catch (error: any) {
    console.error('Get school updates error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch school updates', 
      error: error.message 
    });
  }
};

// Feature or unfeature a post (admin only)
export const toggleFeaturePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can feature posts' });
    }

    // Find the post
    const post = await (Post.findById as any)(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Toggle featured status
    post.isFeatured = !post.isFeatured;
    await post.save();

    // Get updated post with populated fields
    const updatedPost = await (Post.findById as any)(postId)
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

    // Format the response with consistent id field
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
  } catch (error: any) {
    console.error('Toggle feature post error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle featured status', 
      error: error.message 
    });
  }
};
