import { Request, Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';

interface AuthRequest extends Request {
  user?: {
    id: string;
    _id: string;
    role: string;
  };
}

// Create a comment
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user?.id || req.user?._id;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Create new comment
    const newComment = new Comment({
      content,
      author: userId,
      post: postId,
      ...(parentCommentId && { parentComment: parentCommentId })
    });

    // Save comment
    const savedComment = await newComment.save();
    
    // Increment commentCount in post
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Populate author details for the response
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('author', 'name profileImage role');

    return res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: populatedComment
    });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Get comments for a post
export const getPostComments = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Get top-level comments
    const comments = await Comment.find({ post: postId, parentComment: { $exists: false } })
      .populate('author', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of top-level comments
    const total = await Comment.countDocuments({ post: postId, parentComment: { $exists: false } });

    return res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Get replies for a comment
export const getCommentReplies = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Check if comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Get replies
    const replies = await Comment.find({ parentComment: commentId })
      .populate('author', 'name profileImage role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of replies
    const total = await Comment.countDocuments({ parentComment: commentId });

    return res.status(200).json({
      success: true,
      data: replies,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching replies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch replies',
      error: error.message
    });
  }
};

// Like a comment
export const likeComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user already liked this comment
    const alreadyLiked = comment.likes.includes(userId as any);
    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        message: 'You have already liked this comment'
      });
    }

    // Add user to likes array
    comment.likes.push(userId as any);
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment liked successfully',
      data: {
        likeCount: comment.likes.length
      }
    });
  } catch (error: any) {
    console.error('Error liking comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message
    });
  }
};

// Unlike a comment
export const unlikeComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user has liked this comment
    const likeIndex = comment.likes.findIndex(
      like => like.toString() === userId.toString()
    );
    
    if (likeIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You have not liked this comment'
      });
    }

    // Remove user from likes array
    comment.likes.splice(likeIndex, 1);
    await comment.save();

    return res.status(200).json({
      success: true,
      message: 'Comment unliked successfully',
      data: {
        likeCount: comment.likes.length
      }
    });
  } catch (error: any) {
    console.error('Error unliking comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to unlike comment',
      error: error.message
    });
  }
};

// Delete a comment (only the author or an admin can delete)
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const userRole = req.user?.role;

    // Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is the author or an admin
    const isAuthor = comment.author.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this comment'
      });
    }

    // Decrement comment count in post
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -1 }
    });

    // Delete the comment
    await Comment.findByIdAndDelete(commentId);

    // Also delete any replies to this comment
    const deletedReplies = await Comment.deleteMany({ parentComment: commentId });

    // If there were replies, update the post's commentCount accordingly
    if (deletedReplies.deletedCount > 0) {
      await Post.findByIdAndUpdate(comment.post, {
        $inc: { commentCount: -deletedReplies.deletedCount }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};
