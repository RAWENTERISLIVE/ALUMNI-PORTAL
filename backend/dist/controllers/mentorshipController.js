"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToRequest = exports.requestMentorship = exports.getMentorshipProfile = exports.becomeMentor = exports.getMentors = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const notifications_1 = require("../utils/notifications");
const getMentors = async (_req, res) => {
    try {
        const search = typeof _req.query.search === 'string' ? _req.query.search.trim() : '';
        const expertise = typeof _req.query.expertise === 'string' ? _req.query.expertise.trim() : '';
        const where = { isMentor: true, isActive: true };
        if (expertise) {
            where.expertise = { has: expertise };
        }
        const mentors = await prisma_1.default.mentorshipProfile.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        profileImage: true,
                        jobTitle: true,
                        admissionYear: true,
                        company: true
                    }
                }
            }
        });
        const formattedMentors = mentors
            .map((mentor) => ({
            id: mentor.id,
            bio: mentor.bio || '',
            expertise: mentor.expertise || [],
            experience: mentor.experience || '',
            availability: mentor.availability || 'medium',
            rating: mentor.rating || 0,
            reviewCount: mentor.totalRatings || 0,
            user: {
                id: mentor.user.id,
                name: mentor.user.name,
                title: mentor.user.jobTitle || 'Alumni Mentor',
                graduationYear: mentor.user.admissionYear,
                profileImage: mentor.user.profileImage,
                company: mentor.user.company
            }
        }))
            .filter((mentor) => {
            if (!search)
                return true;
            const haystack = [
                mentor.user.name,
                mentor.user.title,
                mentor.bio,
                ...(mentor.expertise || [])
            ]
                .join(' ')
                .toLowerCase();
            return haystack.includes(search.toLowerCase());
        });
        res.json({ success: true, data: formattedMentors });
    }
    catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.getMentors = getMentors;
const becomeMentor = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const profileData = req.body;
        const existingUser = await prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!existingUser) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        const profile = await prisma_1.default.mentorshipProfile.upsert({
            where: { userId },
            create: {
                userId,
                isMentor: true,
                isActive: true,
                expertise: profileData.expertise || [],
                experience: profileData.experience || '',
                industry: profileData.industry || '',
                yearsOfExperience: profileData.yearsOfExperience || 0,
                bio: profileData.bio || '',
                availability: profileData.availability || 'medium',
                preferredMenteeLevel: profileData.preferredMenteeLevel || ['new_graduate'],
                maxMentees: profileData.maxMentees || 3,
                currentMentees: profileData.currentMentees || 0,
                communicationPreferences: profileData.communicationPreferences || ['email']
            },
            update: {
                ...profileData,
                isMentor: true,
                isActive: true
            }
        });
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { isAvailableAsMentor: true }
        });
        const formattedProfile = {
            ...profile,
            id: profile.id,
            userId: {
                id: existingUser.id,
                firstName: existingUser.firstName || (existingUser.name ? existingUser.name.split(' ')[0] : ''),
                lastName: existingUser.lastName || (existingUser.name ? existingUser.name.split(' ').slice(1).join(' ') : ''),
                email: existingUser.email
            }
        };
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
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const profile = await prisma_1.default.mentorshipProfile.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        profileImage: true,
                        name: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        const requests = await prisma_1.default.mentorshipRequest.findMany({
            where: {
                menteeId: userId,
                status: 'accepted'
            },
            include: {
                mentor: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                jobTitle: true,
                                profileImage: true
                            }
                        }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
        const formattedRequests = requests.map((request) => ({
            id: request.id,
            nextSession: request.updatedAt,
            topics: request.mentor.expertise || [],
            mentor: {
                user: {
                    id: request.mentor.user.id,
                    name: request.mentor.user.name,
                    title: request.mentor.user.jobTitle || 'Alumni Mentor',
                    profileImage: request.mentor.user.profileImage
                }
            }
        }));
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
                    availability: '',
                    requests: formattedRequests
                }
            });
            return;
        }
        const formattedProfile = {
            ...profile,
            id: profile.id,
            userId: {
                id: profile.user.id,
                email: profile.user.email,
                profileImage: profile.user.profileImage,
                name: profile.user.name,
                firstName: profile.user.firstName,
                lastName: profile.user.lastName
            },
            requests: formattedRequests
        };
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
    const menteeId = req.user?.id;
    const { message } = req.body;
    if (!menteeId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    if (!mentorId) {
        res.status(400).json({ success: false, message: 'Mentor ID is required' });
        return;
    }
    const mentorProfile = await prisma_1.default.mentorshipProfile.findUnique({
        where: { id: mentorId },
        select: { id: true, userId: true, isMentor: true, isActive: true }
    });
    if (!mentorProfile || !mentorProfile.isMentor || !mentorProfile.isActive) {
        res.status(404).json({ success: false, message: 'Mentor not found' });
        return;
    }
    if (mentorProfile.userId === menteeId) {
        res.status(400).json({ success: false, message: 'You cannot request mentorship from yourself' });
        return;
    }
    const existing = await prisma_1.default.mentorshipRequest.findFirst({
        where: {
            menteeId,
            mentorProfileId: mentorId,
            status: {
                in: ['pending', 'accepted']
            }
        },
        select: { id: true, status: true }
    });
    if (existing) {
        res.status(400).json({ success: false, message: `Mentorship request already ${existing.status}` });
        return;
    }
    await prisma_1.default.mentorshipRequest.create({
        data: {
            menteeId,
            mentorProfileId: mentorId,
            message: message || null,
            status: 'pending'
        }
    });
    const mentee = await prisma_1.default.user.findUnique({
        where: { id: menteeId },
        select: { name: true }
    });
    await (0, notifications_1.createNotification)({
        userId: mentorProfile.userId,
        title: 'New mentorship request',
        message: `${mentee?.name || 'A user'} sent you a mentorship request.`,
        type: 'mentorship',
        actionUrl: '/mentorship',
        metadata: {
            mentorProfileId: mentorId,
            menteeId
        }
    });
    res.json({ success: true, message: 'Mentorship request sent' });
};
exports.requestMentorship = requestMentorship;
const respondToRequest = async (req, res) => {
    const { requestId, action } = req.params;
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    if (!requestId || !action) {
        res.status(400).json({ success: false, message: 'Request ID and action are required' });
        return;
    }
    if (!['accept', 'reject'].includes(action)) {
        res.status(400).json({ success: false, message: 'Invalid action' });
        return;
    }
    const request = await prisma_1.default.mentorshipRequest.findUnique({
        where: { id: requestId },
        include: { mentor: { select: { userId: true } } }
    });
    if (!request) {
        res.status(404).json({ success: false, message: 'Mentorship request not found' });
        return;
    }
    if (request.mentor.userId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Not authorized to respond to this request' });
        return;
    }
    await prisma_1.default.mentorshipRequest.update({
        where: { id: requestId },
        data: {
            status: action === 'accept' ? 'accepted' : 'rejected'
        }
    });
    const mentor = await prisma_1.default.user.findUnique({
        where: { id: req.user.id },
        select: { name: true }
    });
    await (0, notifications_1.createNotification)({
        userId: request.menteeId,
        title: action === 'accept' ? 'Mentorship request accepted' : 'Mentorship request rejected',
        message: `${mentor?.name || 'Your mentor'} ${action === 'accept' ? 'accepted' : 'rejected'} your mentorship request.`,
        type: 'mentorship',
        actionUrl: '/mentorship',
        metadata: {
            requestId,
            action
        }
    });
    res.json({ success: true, message: 'Responded to request' });
};
exports.respondToRequest = respondToRequest;
//# sourceMappingURL=mentorshipController.js.map