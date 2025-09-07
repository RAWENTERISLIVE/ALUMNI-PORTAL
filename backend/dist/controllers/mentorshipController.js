"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenteeRequests = exports.getMentorRequests = exports.respondToRequest = exports.requestMentorship = exports.getMentorshipProfile = exports.becomeMentor = exports.getMentors = void 0;
const MentorshipProfile_1 = __importDefault(require("../models/MentorshipProfile"));
const MentorshipRequest_1 = __importDefault(require("../models/MentorshipRequest"));
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
    try {
        const { mentorId } = req.params;
        const { message, topics, preferredSchedule } = req.body;
        const menteeId = req.user.id;
        if (!topics || !Array.isArray(topics) || topics.length === 0) {
            res.status(400).json({ success: false, message: 'At least one topic is required' });
            return;
        }
        const mentor = await MentorshipProfile_1.default.findOne({
            userId: mentorId,
            isMentor: true,
            isActive: true
        });
        if (!mentor) {
            res.status(404).json({ success: false, message: 'Mentor not found or not active' });
            return;
        }
        const existingRequest = await MentorshipRequest_1.default.findOne({
            mentorId,
            menteeId,
            status: 'pending'
        });
        if (existingRequest) {
            res.status(400).json({ success: false, message: 'You already have a pending request to this mentor' });
            return;
        }
        const request = new MentorshipRequest_1.default({
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
    }
    catch (error) {
        console.error('Error in requestMentorship:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.requestMentorship = requestMentorship;
const respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.params;
        const mentorId = req.user.id;
        if (!['accept', 'reject'].includes(action)) {
            res.status(400).json({ success: false, message: 'Invalid action. Use accept or reject' });
            return;
        }
        const request = await MentorshipRequest_1.default.findById(requestId);
        if (!request) {
            res.status(404).json({ success: false, message: 'Request not found' });
            return;
        }
        if (request.mentorId.toString() !== mentorId) {
            res.status(403).json({ success: false, message: 'Unauthorized' });
            return;
        }
        if (request.status !== 'pending') {
            res.status(400).json({ success: false, message: 'Request has already been responded to' });
            return;
        }
        request.status = action === 'accept' ? 'accepted' : 'rejected';
        request.respondedAt = new Date();
        await request.save();
        res.json({
            success: true,
            message: `Request ${action}ed successfully`,
            data: request
        });
    }
    catch (error) {
        console.error('Error in respondToRequest:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.respondToRequest = respondToRequest;
const getMentorRequests = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const requests = await MentorshipRequest_1.default.find({ mentorId })
            .populate('menteeId', 'name firstName lastName email profileImage')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    }
    catch (error) {
        console.error('Error in getMentorRequests:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMentorRequests = getMentorRequests;
const getMenteeRequests = async (req, res) => {
    try {
        const menteeId = req.user.id;
        const requests = await MentorshipRequest_1.default.find({ menteeId })
            .populate('mentorId', 'name firstName lastName email profileImage')
            .sort({ createdAt: -1 });
        res.json({ success: true, data: requests });
    }
    catch (error) {
        console.error('Error in getMenteeRequests:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMenteeRequests = getMenteeRequests;
//# sourceMappingURL=mentorshipController.js.map