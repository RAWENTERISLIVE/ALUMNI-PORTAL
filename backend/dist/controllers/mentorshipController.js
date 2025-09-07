"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToRequest = exports.requestMentorship = exports.getMentorshipProfile = exports.becomeMentor = exports.getMentors = void 0;
const MentorshipProfile_1 = __importDefault(require("../models/MentorshipProfile"));
const User_1 = __importDefault(require("../models/User"));
const getMentors = async (_req, res) => {
    try {
        const mentors = await MentorshipProfile_1.default.find({ isMentor: true, isActive: true })
            .populate('userId', 'name firstName lastName email profileImage');
        const formattedMentors = mentors.map(mentor => {
            const user = mentor.userId;
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
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMentors = getMentors;
const becomeMentor = async (req, res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;
        console.log('becomeMentor request:', { userId, profileData });
        const existingUser = await User_1.default.findById(userId);
        if (!existingUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        let profile = await MentorshipProfile_1.default.findOne({ userId });
        if (profile) {
            profile.isMentor = true;
            Object.keys(profileData).forEach(key => {
                if (profileData[key] !== undefined && key in profile) {
                    profile[key] = profileData[key];
                }
            });
        }
        else {
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
            profile = new MentorshipProfile_1.default({
                ...defaultValues,
                ...profileData,
                userId,
                isMentor: true,
                isActive: true
            });
        }
        await profile.save();
        await existingUser.updateOne({ isAvailableAsMentor: true });
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
    }
    catch (error) {
        console.error('Error becoming mentor:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.becomeMentor = becomeMentor;
const getMentorshipProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await MentorshipProfile_1.default.findOne({ userId }).populate('userId', 'name email firstName lastName profileImage');
        if (!profile) {
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
        const formattedProfile = profile.toObject();
        formattedProfile.id = profile._id.toString();
        if (profile.userId && 'email' in profile.userId) {
            const user = profile.userId;
            formattedProfile.userId = {
                id: user._id.toString(),
                email: user.email,
                profileImage: user.profileImage,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
            };
        }
        res.json({ success: true, data: formattedProfile });
    }
    catch (error) {
        console.error('Error getting mentorship profile:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMentorshipProfile = getMentorshipProfile;
const requestMentorship = async (req, res) => {
    const { mentorId } = req.params;
    const menteeId = req.user.id;
    console.log(`Mentorship request from ${menteeId} to ${mentorId}`);
    res.json({ success: true, message: 'Mentorship request sent' });
};
exports.requestMentorship = requestMentorship;
const respondToRequest = async (req, res) => {
    const { requestId, action } = req.params;
    console.log(`Responding to request ${requestId} with action ${action}`);
    res.json({ success: true, message: 'Responded to request' });
};
exports.respondToRequest = respondToRequest;
//# sourceMappingURL=mentorshipController.js.map