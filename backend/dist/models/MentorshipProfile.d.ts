import mongoose, { Document } from 'mongoose';
export interface IMentorshipProfile extends Document {
    _id: string;
    userId: mongoose.Types.ObjectId;
    isMentor: boolean;
    isSeekingMentor: boolean;
    expertise: string[];
    experience: string;
    industry: string;
    company?: string;
    position?: string;
    yearsOfExperience: number;
    bio: string;
    availability: 'high' | 'medium' | 'low';
    preferredMenteeLevel: ('student' | 'new_graduate' | 'early_career' | 'mid_career')[];
    maxMentees: number;
    currentMentees: number;
    careerGoals?: string[];
    currentLevel: 'student' | 'new_graduate' | 'early_career' | 'mid_career';
    interestedFields: string[];
    mentorshipGoals: string;
    preferredMentorExperience: string;
    communicationPreferences: ('video_call' | 'phone_call' | 'text_messages' | 'email' | 'in_person')[];
    timezone: string;
    linkedInUrl?: string;
    portfolioUrl?: string;
    isActive: boolean;
    rating: number;
    totalRatings: number;
    successfulMatches: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const MentorshipProfile: mongoose.Model<IMentorshipProfile, {}, {}, {}, mongoose.Document<unknown, {}, IMentorshipProfile, {}> & IMentorshipProfile & Required<{
    _id: string;
}> & {
    __v: number;
}, any>;
export default MentorshipProfile;
//# sourceMappingURL=MentorshipProfile.d.ts.map