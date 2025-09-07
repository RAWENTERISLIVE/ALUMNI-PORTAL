import { Request, Response } from 'express';
import MentorshipProfile from '../models/MentorshipProfile';
import MentorshipRequest from '../models/MentorshipRequest';
import User from '../models/User';

// Get all available mentors
export const getMentors = async (_req: Request, res: Response): Promise<void> => {
  try {
    const mentors = await MentorshipProfile.find({ isMentor: true, isActive: true })
      .populate('userId', 'name firstName lastName email profileImage');
    
    // Format the response to match what frontend expects
    const formattedMentors = mentors.map(mentor => {
      const user = mentor.userId as any;
      return {
        ...mentor.toJSON(),
        userId: {
          _id: user._id,
          firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
          lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : ''),
          email: user.email,
          profilePicture: user.profileImage
        }
      };
    });
    
    res.json({ success: true, data: formattedMentors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Become a mentor
export const becomeMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profileData = req.body;

    console.log('becomeMentor request:', { userId, profileData });

    // First check if user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let profile = await MentorshipProfile.findOne({ userId });

    if (profile) {
      profile.isMentor = true;
      // Only update fields that are provided in the request
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined && key in profile!) {
          (profile as any)[key] = profileData[key];
        }
      });
    } else {
      // Set default values for required fields if not provided
      const defaultValues = {
        expertise: [],
        experience: '',
        industry: '',
        yearsOfExperience: 0,
        bio: '',
        availability: 'medium',
        preferredMenteeLevel: ['new_graduate'],
        maxMentees: 3,
        currentMentees: 0,
        communicationPreferences: ['email']
      };
      
      profile = new MentorshipProfile({ 
        ...defaultValues,
        ...profileData, 
        userId, 
        isMentor: true,
        isActive: true
      });
    }

    await profile.save();
    
    // Update user record to mark as available for mentorship
    await existingUser.updateOne({ isAvailableAsMentor: true });
    
    // Format the response to match frontend expectations
    const formattedProfile = {
      ...profile.toObject(),
      id: profile._id.toString(),
      userId: {
        id: existingUser._id.toString(),
        firstName: existingUser.firstName || (existingUser.name ? existingUser.name.split(' ')[0] : ''),
        lastName: existingUser.lastName || (existingUser.name ? existingUser.name.split(' ').slice(1).join(' ') : ''),
        email: existingUser.email
      }
    };
    
    console.log('becomeMentor response:', { success: true, formattedProfile });
    res.json({ success: true, data: formattedProfile });
  } catch (error) {
    console.error('Error becoming mentor:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get user's mentorship profile
export const getMentorshipProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const profile = await MentorshipProfile.findOne({ userId }).populate('userId', 'name email firstName lastName profileImage');
    
    if (!profile) {
      // Return an empty profile with default values if none exists
      res.json({ 
        success: true, 
        data: { 
          userId,
          isMentor: false,
          isActive: false,
          expertise: [],
          experience: '',
          industry: '',
          yearsOfExperience: 0,
          availability: ''
        }
      });
      return;
    }
    
    // Format the response
    const formattedProfile = profile.toObject();
    (formattedProfile as any).id = profile._id.toString();

    if (profile.userId && 'email' in profile.userId) {
      const user = profile.userId as any;
      (formattedProfile as any).userId = {
        id: user._id.toString(),
        email: user.email,
        profileImage: user.profileImage,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
    
    res.json({ success: true, data: formattedProfile });
  } catch (error) {
    console.error('Error getting mentorship profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Request mentorship from a mentor
export const requestMentorship = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mentorId } = req.params;
    const { message, topics, preferredSchedule } = req.body;
    const menteeId = (req as any).user.id;

    // Validate input
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      res.status(400).json({ success: false, message: 'At least one topic is required' });
      return;
    }

    // Check if mentor exists and is active
    const mentor = await MentorshipProfile.findOne({ 
      userId: mentorId, 
      isMentor: true, 
      isActive: true 
    });
    
    if (!mentor) {
      res.status(404).json({ success: false, message: 'Mentor not found or not active' });
      return;
    }

    // Check if there's already a pending request
    const existingRequest = await MentorshipRequest.findOne({
      mentorId,
      menteeId,
      status: 'pending'
    });

    if (existingRequest) {
      res.status(400).json({ success: false, message: 'You already have a pending request to this mentor' });
      return;
    }

    // Create the mentorship request
    const request = new MentorshipRequest({
      mentorId,
      menteeId,
      message: message || '',
      topics,
      preferredSchedule: preferredSchedule || ''
    });

    await request.save();

    res.json({ 
      success: true, 
      message: 'Mentorship request sent successfully',
      data: request
    });
  } catch (error) {
    console.error('Error in requestMentorship:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Respond to a mentorship request
export const respondToRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, action } = req.params;
    const mentorId = (req as any).user.id;

    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ success: false, message: 'Invalid action. Use accept or reject' });
      return;
    }

    const request = await MentorshipRequest.findById(requestId);
    
    if (!request) {
      res.status(404).json({ success: false, message: 'Request not found' });
      return;
    }

    // Verify the current user is the mentor for this request
    if (request.mentorId.toString() !== mentorId) {
      res.status(403).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (request.status !== 'pending') {
      res.status(400).json({ success: false, message: 'Request has already been responded to' });
      return;
    }

    // Update the request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';
    request.respondedAt = new Date();
    
    await request.save();

    res.json({ 
      success: true, 
      message: `Request ${action}ed successfully`,
      data: request
    });
  } catch (error) {
    console.error('Error in respondToRequest:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get mentorship requests for a mentor (received requests)
export const getMentorRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const mentorId = (req as any).user.id;
    
    const requests = await MentorshipRequest.find({ mentorId })
      .populate('menteeId', 'name firstName lastName email profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error in getMentorRequests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get mentorship requests for a mentee (sent requests)
export const getMenteeRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const menteeId = (req as any).user.id;
    
    const requests = await MentorshipRequest.find({ menteeId })
      .populate('mentorId', 'name firstName lastName email profileImage')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Error in getMenteeRequests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
