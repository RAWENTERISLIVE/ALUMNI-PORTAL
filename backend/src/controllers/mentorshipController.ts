import { Request, Response } from 'express';
import MentorshipProfile from '../models/MentorshipProfile';
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
export const requestMentorship = async (req: Request, res: Response) => {
  // This is a placeholder. In a real application, you would create a MentorshipRequest model
  // and handle the request lifecycle (pending, accepted, rejected).
  const { mentorId } = req.params;
  const menteeId = (req as any).user.id;

  console.log(`Mentorship request from ${menteeId} to ${mentorId}`);

  res.json({ success: true, message: 'Mentorship request sent' });
};

// Respond to a mentorship request
export const respondToRequest = async (req: Request, res: Response) => {
  // This is a placeholder.
  const { requestId, action } = req.params; // action can be 'accept' or 'reject'

  console.log(`Responding to request ${requestId} with action ${action}`);

  res.json({ success: true, message: 'Responded to request' });
};
