import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

// Helper function to safely check if an ID is in an array
const isIdInArray = (idArray: mongoose.Types.ObjectId[], idToCheck: string | mongoose.Types.ObjectId): boolean => {
  if (!idArray || !idArray.length) return false;
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
      imageUrl, 
      visibility, 
      tags,
      isSchoolUpdate, 
      attachments, 
      pollOptions, 
      pollEndsAt,
      mentions 
    } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(400).json({ success: false, message: 'Author ID is missing.' });
    }
    
    const author = req.user._id;

    // Build post object with all possible fields
    const postData: any = {
      title,
      content,
      author,
      category,
      imageUrl,
      visibility,
      tags,
      isSchoolUpdate: isSchoolUpdate || false,
      isFeatured: false, // Admins can feature posts later
    };

    // Add optional fields if they exist
    if (attachments && attachments.length) {
      postData.attachments = attachments;
    }

    if (pollOptions && pollOptions.length) {
      postData.pollOptions = pollOptions.map((option: string) => ({
        text: option,
        votes: []
      }));
      if (pollEndsAt) {
        postData.pollEndsAt = new Date(pollEndsAt);
      }
    }

    if (mentions && mentions.length) {
      postData.mentions = mentions;
    }

    const post = new Post(postData);

    await post.save();
    
    // Format the response with consistent id field
    const formattedPost = {
      ...post.toObject(),
      id: post._id.toString()
    };
    
    return res.status(201).json({ success: true, message: 'Post created successfully', post: formattedPost });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
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
      isSchoolUpdate,
      withPolls,
      withAttachments
    } = req.query;

    const query: any = {};
    if (authorId) query.author = authorId as string;
    if (category) query.category = category as string;
    if (visibility) query.visibility = visibility as string;
    if (tag) query.tags = { $in: [tag as string] };
    if (isSchoolUpdate !== undefined) query.isSchoolUpdate = isSchoolUpdate === 'true';
    if (withPolls) query.pollOptions = { $exists: true, $ne: [] };
    if (withAttachments) query.attachments = { $exists: true, $ne: [] };

    const posts = await Post.find(query)
      .populate('author', 'name email profileImage') // Populate author details
      .populate('mentions', 'name email profileImage') // Populate mentioned users
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'name profileImage role classYear email'
        }
      }) // Populate shared posts
      .sort({ [sortBy as string]: sortOrder === 'asc' ? 1 : -1 })
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
        id: post.author._id ? post.author._id.toString() : undefined
      } : undefined,
      mentions: post.mentions ? post.mentions.map((user: any) => ({
        ...user,
        id: user._id ? user._id.toString() : undefined
      })) : undefined
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
    return res.status(500).json({ success: false, message: 'Failed to fetch posts', error: error.message });
  }
};

// Get a single post by ID
export const getPostById = async (req: Request, res: Response): Promise<any> => {
  try {
    const post = await Post.findById(req.params.postId)
                           .populate('author', 'name email profileImage')
                           .populate({
                             path: 'sharedPost',
                             populate: {
                               path: 'author',
                               select: 'name profileImage role classYear email'
                             }
                           })
                           .populate('comments');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    
    // Format the response with consistent id field
    const formattedPost = {
      ...post.toObject(),
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: (post.author as any)._id ? (post.author as any)._id.toString() : undefined
      } : undefined
    };
    
    return res.status(200).json({ success: true, post: formattedPost });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
  }
};

// Update a post
export const updatePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;
    const { title, content, category, imageUrl, visibility, tags } = req.body;

    // Find the post first
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the user is the author or an admin
    if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    // Update the post with new values
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { title, content, category, imageUrl, visibility, tags },
      { new: true, runValidators: true }
    )
    .populate('author', 'name email profileImage')
    .populate({
      path: 'sharedPost',
      populate: {
        path: 'author',
        select: 'name profileImage role classYear email'
      }
    });
    
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found after update' });
    }

    // Format the response with consistent id field
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id.toString(),
      author: updatedPost.author ? {
        ...updatedPost.author,
        id: (updatedPost.author as any)._id ? (updatedPost.author as any)._id.toString() : undefined
      } : undefined
    };
    
    return res.status(200).json({ success: true, message: 'Post updated successfully', post: formattedPost });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update post', error: error.message });
  }
};

// Delete a post
export const deletePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the user is the author or an admin
    if (post.author.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);
    
    return res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};

// Like or unlike a post
export const likePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;
    const { reactionType = 'like' } = req.body;  // Default to 'like' if not specified

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Initialize reactions array if it doesn't exist
    if (!post.reactions) {
      post.reactions = [];
    }

    // Check if the user has already reacted
    const existingReactionIndex = post.reactions.findIndex(
      reaction => reaction && reaction.userId.toString() === userId.toString()
    );

    if (existingReactionIndex !== -1) {
      const existingReaction = post.reactions[existingReactionIndex];
      // If reaction type is the same, remove it (unlike/unreact)
      if (existingReaction && existingReaction.type === reactionType) {
        post.reactions.splice(existingReactionIndex, 1);
      } else if (existingReaction) {
        // Otherwise, update the reaction type
        existingReaction.type = reactionType;
      }
    } else {
      // Add new reaction
      post.reactions.push({ userId: toObjectId(userId), type: reactionType });
    }

    await post.save();

    // Get updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name email profileImage')
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'name profileImage role classYear email'
        }
      });
    
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found after update' });
    }

    // Format the response with consistent id field
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id.toString(),
      author: updatedPost.author ? {
        ...updatedPost.author,
        id: (updatedPost.author as any)._id ? (updatedPost.author as any)._id.toString() : undefined
      } : undefined
    };

    return res.status(200).json({ 
      success: true, 
      message: 'Reaction updated successfully', 
      post: formattedPost 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update reaction', error: error.message });
  }
};

// Feature or unfeature a post (admin only)
export const toggleFeaturePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only administrators can feature posts' });
    }

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Toggle featured status
    post.isFeatured = !post.isFeatured;
    await post.save();

    // Get updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name email profileImage')
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'name profileImage role classYear email'
        }
      });
    
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found after update' });
    }

    // Format the response with consistent id field
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id.toString(),
      author: updatedPost.author ? {
        ...updatedPost.author,
        id: (updatedPost.author as any)._id ? (updatedPost.author as any)._id.toString() : undefined
      } : undefined
    };

    return res.status(200).json({ 
      success: true, 
      message: post.isFeatured ? 'Post featured' : 'Post unfeatured', 
      post: formattedPost 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to toggle featured status', error: error.message });
  }
};

// Get featured posts
export const getFeaturedPosts = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ isFeatured: true })
      .populate('author', 'name email profileImage')
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
        id: post.author._id ? post.author._id.toString() : undefined
      } : undefined
    }));

    return res.status(200).json({ success: true, data: formattedPosts });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured posts', error: error.message });
  }
};

// Get school updates
export const getSchoolUpdates = async (req: Request, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ isSchoolUpdate: true })
      .populate('author', 'name email profileImage')
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
        id: post.author._id ? post.author._id.toString() : undefined
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
    return res.status(500).json({ success: false, message: 'Failed to fetch school updates', error: error.message });
  }
};

// Bookmark a post
export const bookmarkPost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Initialize bookmarks array if it doesn't exist
    if (!post.bookmarks) {
      post.bookmarks = [];
    }

    // Check if the post is already bookmarked by this user
    const alreadyBookmarked = isIdInArray(post.bookmarks, userId);

    if (alreadyBookmarked) {
      // Remove the bookmark
      post.bookmarks = post.bookmarks.filter(id => id.toString() !== userId.toString());
      await post.save();
      return res.status(200).json({ success: true, message: 'Post unbookmarked successfully', isBookmarked: false });
    } else {
      // Add the bookmark
      post.bookmarks.push(toObjectId(userId));
      await post.save();
      return res.status(200).json({ success: true, message: 'Post bookmarked successfully', isBookmarked: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to bookmark post', error: error.message });
  }
};

// Vote on a poll
export const voteOnPoll = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const postId = req.params.postId;
    const { optionIndex } = req.body;
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({ success: false, message: 'Invalid option index' });
    }

    // Find the post
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check if the post has poll options
    if (!post.pollOptions || post.pollOptions.length <= optionIndex) {
      return res.status(400).json({ success: false, message: 'Invalid poll option' });
    }

    // Check if the poll has ended
    if (post.pollEndsAt && new Date(post.pollEndsAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'This poll has ended' });
    }

    // Check if the user has already voted on this poll
    let userHasVoted = false;
    
    // Remove previous votes from any option
    if (post.pollOptions) {
      for (let i = 0; i < post.pollOptions.length; i++) {
        const option = post.pollOptions[i];
        if (option && option.votes) {
          const votedIndex = option.votes.findIndex(id => id.toString() === userId.toString());
          
          if (votedIndex !== -1) {
            userHasVoted = true;
            // Remove the previous vote
            if (post.pollOptions[i] && post.pollOptions[i]?.votes) {
              post.pollOptions[i]!.votes = post.pollOptions[i]!.votes.filter(id => id.toString() !== userId.toString());
            }
          }
        }
      }
    }

    // Add the new vote
    if (post.pollOptions && post.pollOptions[optionIndex]) {
      post.pollOptions[optionIndex].votes.push(toObjectId(userId));
    }
    
    await post.save();

    // Get updated post with populated fields
    const updatedPost = await Post.findById(postId)
      .populate('author', 'name email profileImage')
      .populate({
        path: 'sharedPost',
        populate: {
          path: 'author',
          select: 'name profileImage role classYear email'
        }
      });
    
    if (!updatedPost) {
      return res.status(404).json({ success: false, message: 'Post not found after update' });
    }

    // Format the response with consistent id field
    const formattedPost = {
      ...updatedPost.toObject(),
      id: updatedPost._id.toString(),
      author: updatedPost.author ? {
        ...updatedPost.author,
        id: (updatedPost.author as any)._id ? (updatedPost.author as any)._id.toString() : undefined
      } : undefined
    };

    return res.status(200).json({ 
      success: true, 
      message: userHasVoted ? 'Vote changed successfully' : 'Vote recorded successfully', 
      post: formattedPost 
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to vote on poll', error: error.message });
  }
};

// Share a post
export const sharePost = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { originalPostId, content, visibility, shareType = 'simple' } = req.body;
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user._id;

    // Find the original post
    const originalPost = await Post.findById(originalPostId);
    
    if (!originalPost) {
      return res.status(404).json({ success: false, message: 'Original post not found' });
    }

    // Create a new post that shares the original
    const sharedPost = new Post({
      author: userId,
      content: content || '', // Optional commentary
      visibility: visibility || 'public',
      sharedPost: originalPostId, // Reference to the original post
      shareType
    });

    await sharedPost.save();
    
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
    return res.status(500).json({ success: false, message: 'Failed to share post', error: error.message });
  }
};

// Get user's post timeline/feed
export const getUserTimeline = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { page = 1, limit = 10, filter } = req.query;
    if (!req.user || !req.user._id) {
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
      // Default: posts visible to the user (public, connections if they are connected, or own private)
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

    const posts = await Post.find(query)
      .populate('author', 'name email profileImage')
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
        id: post.author._id ? post.author._id.toString() : undefined
      } : undefined,
      mentions: post.mentions ? post.mentions.map((user: any) => ({
        ...user,
        id: user._id ? user._id.toString() : undefined
      })) : undefined,
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
    return res.status(500).json({ success: false, message: 'Failed to fetch user timeline', error: error.message });
  }
};

// Get bookmarked posts
export const getBookmarkedPosts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
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
    const posts = await Post.find({
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
        id: post.author._id ? post.author._id.toString() : undefined
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
    console.error('Error getting bookmarked posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get bookmarked posts',
      error: error.message
    });
  }
};

// Get feed posts (posts from connections)
export const getFeedPosts = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    const userId = req.user._id;

    // Get user's connections
    const user = await User.findById(userId);
    if (!user) {
      // User not found
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Prepare connections array - if the user has no connections, use just their own ID
    // so they at least see their own posts
    const connections = user.connections && user.connections.length > 0 
      ? [...user.connections]
      : [];

    // Find posts either from the user's connections or public posts
    const posts = await Post.find({
      $or: [
        // Posts from connections that are either public or visible to connections
        { author: { $in: connections }, visibility: { $in: ['public', 'connections_only'] } },
        // User's own posts
        { author: userId }
      ]
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
      $or: [
        { author: { $in: connections }, visibility: { $in: ['public', 'connections_only'] } },
        { author: userId }
      ]
    });

    // Format the response to match expected frontend structure
    const formattedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString(),
      author: post.author ? {
        ...post.author,
        id: post.author._id ? post.author._id.toString() : undefined
      } : undefined,
      isLiked: post.reactions ? post.reactions.some((reaction: any) => 
        reaction.userId && reaction.userId.toString() === userId.toString() && reaction.type === 'like'
      ) : false,
      isBookmarked: post.bookmarks ? isIdInArray(post.bookmarks, userId) : false
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
    console.error('Error getting feed posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get feed posts',
      error: error.message
    });
  }
};
