"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToRequest = exports.requestMentorship = exports.getMentorshipProfile = exports.becomeMentor = exports.getMentors = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const notifications_1 = require("../utils/notifications");
const getAuthUserId = (req) => req.user?.id || req.user?._id;
const DEFAULT_AVAILABILITY = {
    monthlyAvailability: '2-3 hours/month',
    sessionMode: 'chat',
    availableSlots: [],
    iceBreakerTemplate: 'Hi {{mentorName}}, I am {{menteeName}}. I need guidance on {{topic}} and would love a quick {{sessionMode}} session if possible.'
};
const normalizeSessionMode = (value) => {
    if (value === 'video' || value === 'meet' || value === 'chat')
        return value;
    return 'chat';
};
const normalizeSlot = (raw) => {
    if (!raw || typeof raw !== 'object')
        return null;
    const slot = raw;
    const day = typeof slot.day === 'string' ? slot.day.trim() : '';
    const startTime = typeof slot.startTime === 'string' ? slot.startTime.trim() : '';
    const endTime = typeof slot.endTime === 'string' ? slot.endTime.trim() : '';
    if (!day || !startTime || !endTime)
        return null;
    return { day, startTime, endTime };
};
const parseAvailabilitySettings = (availability) => {
    if (!availability)
        return { ...DEFAULT_AVAILABILITY };
    try {
        const parsed = JSON.parse(availability);
        return {
            monthlyAvailability: typeof parsed.monthlyAvailability === 'string' && parsed.monthlyAvailability.trim()
                ? parsed.monthlyAvailability.trim()
                : DEFAULT_AVAILABILITY.monthlyAvailability,
            sessionMode: normalizeSessionMode(parsed.sessionMode),
            availableSlots: Array.isArray(parsed.availableSlots)
                ? parsed.availableSlots.map((slot) => normalizeSlot(slot)).filter((slot) => Boolean(slot))
                : [],
            iceBreakerTemplate: typeof parsed.iceBreakerTemplate === 'string' && parsed.iceBreakerTemplate.trim()
                ? parsed.iceBreakerTemplate.trim()
                : DEFAULT_AVAILABILITY.iceBreakerTemplate
        };
    }
    catch {
        return {
            ...DEFAULT_AVAILABILITY,
            monthlyAvailability: availability
        };
    }
};
const parseRequestDetails = (rawMessage) => {
    const source = typeof rawMessage === 'string' ? rawMessage : '';
    let topic = '';
    let sessionMode = 'chat';
    let preferredSlot = null;
    const freeTextLines = [];
    const topicRegex = /^\[Topic:\s*(.+)\]$/i;
    const modeRegex = /^\[Preferred mode:\s*(.+)\]$/i;
    const slotRegex = /^\[Preferred slot:\s*(.+?)\s+(\d{2}:\d{2})-(\d{2}:\d{2})\]$/i;
    source
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .forEach((line) => {
        const topicMatch = topicRegex.exec(line);
        if (topicMatch) {
            topic = topicMatch[1]?.trim() || '';
            return;
        }
        const modeMatch = modeRegex.exec(line);
        if (modeMatch) {
            sessionMode = normalizeSessionMode(modeMatch[1]?.trim());
            return;
        }
        const slotMatch = slotRegex.exec(line);
        if (slotMatch) {
            const startTime = slotMatch[2];
            const endTime = slotMatch[3];
            if (!startTime || !endTime) {
                return;
            }
            preferredSlot = {
                day: slotMatch[1]?.trim() || '',
                startTime,
                endTime,
            };
            return;
        }
        freeTextLines.push(line);
    });
    return {
        topic,
        sessionMode,
        preferredSlot,
        message: freeTextLines.join('\n').trim(),
    };
};
const getMentors = async (_req, res) => {
    try {
        const search = typeof _req.query.search === 'string' ? _req.query.search.trim() : '';
        const expertise = typeof _req.query.expertise === 'string' ? _req.query.expertise.trim() : '';
        const where = {
            isMentor: true,
            isActive: true
        };
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
            .map((mentor) => {
            const settings = parseAvailabilitySettings(mentor.availability);
            return {
                id: mentor.id,
                bio: mentor.bio || '',
                expertise: mentor.expertise || [],
                experience: mentor.experience || '',
                availability: settings.monthlyAvailability,
                sessionMode: settings.sessionMode,
                availableSlots: settings.availableSlots,
                iceBreakerTemplate: settings.iceBreakerTemplate,
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
            };
        })
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
        const userId = getAuthUserId(req);
        if (!userId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        const profileData = req.body;
        const sessionMode = normalizeSessionMode(profileData.sessionMode);
        const availableSlots = Array.isArray(profileData.availableSlots)
            ? profileData.availableSlots
                .map((slot) => normalizeSlot(slot))
                .filter((slot) => Boolean(slot))
                .slice(0, 20)
            : [];
        const monthlyAvailability = typeof profileData.availability === 'string' && profileData.availability.trim()
            ? profileData.availability.trim()
            : DEFAULT_AVAILABILITY.monthlyAvailability;
        const iceBreakerTemplate = typeof profileData.iceBreakerTemplate === 'string' && profileData.iceBreakerTemplate.trim()
            ? profileData.iceBreakerTemplate.trim()
            : DEFAULT_AVAILABILITY.iceBreakerTemplate;
        const availabilityPayload = JSON.stringify({
            monthlyAvailability,
            sessionMode,
            availableSlots,
            iceBreakerTemplate
        });
        const communicationPreferences = Array.from(new Set([
            ...(Array.isArray(profileData.communicationPreferences) ? profileData.communicationPreferences : []),
            sessionMode
        ]
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean)));
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
                availability: availabilityPayload,
                preferredMenteeLevel: profileData.preferredMenteeLevel || ['new_graduate'],
                maxMentees: profileData.maxMentees || 3,
                currentMentees: profileData.currentMentees || 0,
                communicationPreferences: communicationPreferences.length > 0 ? communicationPreferences : ['email', sessionMode]
            },
            update: {
                ...profileData,
                availability: availabilityPayload,
                communicationPreferences: communicationPreferences.length > 0 ? communicationPreferences : ['email', sessionMode],
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
        const userId = getAuthUserId(req);
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
        const incomingRequestsRaw = await prisma_1.default.mentorshipRequest.findMany({
            where: {
                status: 'pending',
                mentor: {
                    userId,
                },
            },
            include: {
                mentee: {
                    select: {
                        id: true,
                        name: true,
                        jobTitle: true,
                        profileImage: true,
                        admissionYear: true,
                        company: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
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
        const incomingRequests = incomingRequestsRaw.map((request) => {
            const details = parseRequestDetails(request.message);
            return {
                id: request.id,
                status: request.status,
                createdAt: request.createdAt,
                topic: details.topic,
                sessionMode: details.sessionMode,
                preferredSlot: details.preferredSlot,
                message: details.message,
                mentee: {
                    user: {
                        id: request.mentee.id,
                        name: request.mentee.name,
                        title: request.mentee.jobTitle || 'Alumni',
                        profileImage: request.mentee.profileImage,
                        graduationYear: request.mentee.admissionYear,
                        company: request.mentee.company,
                    },
                },
            };
        });
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
                    availability: DEFAULT_AVAILABILITY.monthlyAvailability,
                    sessionMode: DEFAULT_AVAILABILITY.sessionMode,
                    availableSlots: [],
                    iceBreakerTemplate: DEFAULT_AVAILABILITY.iceBreakerTemplate,
                    requests: formattedRequests,
                    incomingRequests
                }
            });
            return;
        }
        const settings = parseAvailabilitySettings(profile.availability);
        const formattedProfile = {
            ...profile,
            availability: settings.monthlyAvailability,
            sessionMode: settings.sessionMode,
            availableSlots: settings.availableSlots,
            iceBreakerTemplate: settings.iceBreakerTemplate,
            id: profile.id,
            userId: {
                id: profile.user.id,
                email: profile.user.email,
                profileImage: profile.user.profileImage,
                name: profile.user.name,
                firstName: profile.user.firstName,
                lastName: profile.user.lastName
            },
            requests: formattedRequests,
            incomingRequests
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
    try {
        const { mentorId } = req.params;
        const menteeId = getAuthUserId(req);
        const { message, topic, sessionMode, selectedSlot } = req.body;
        if (!menteeId) {
            res.status(401).json({ success: false, message: 'Authentication required' });
            return;
        }
        if (!mentorId) {
            res.status(400).json({ success: false, message: 'Mentor ID is required' });
            return;
        }
        const normalizedTopic = typeof topic === 'string' ? topic.trim() : '';
        const normalizedMessage = typeof message === 'string' ? message.trim() : '';
        const normalizedMode = normalizeSessionMode(sessionMode);
        const normalizedSlot = normalizeSlot(selectedSlot);
        if (!normalizedTopic) {
            res.status(400).json({ success: false, message: 'Mentorship topic is required' });
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
        const messageLines = [`[Topic: ${normalizedTopic}]`, `[Preferred mode: ${normalizedMode}]`];
        if (normalizedSlot) {
            messageLines.push(`[Preferred slot: ${normalizedSlot.day} ${normalizedSlot.startTime}-${normalizedSlot.endTime}]`);
        }
        if (normalizedMessage) {
            messageLines.push(normalizedMessage);
        }
        await prisma_1.default.mentorshipRequest.create({
            data: {
                menteeId,
                mentorProfileId: mentorId,
                message: messageLines.join('\n'),
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
            message: `${mentee?.name || 'A user'} sent a mentorship request on "${normalizedTopic}" (${normalizedMode}).`,
            type: 'mentorship',
            actionUrl: '/mentorship',
            metadata: {
                mentorProfileId: mentorId,
                menteeId,
                topic: normalizedTopic,
                sessionMode: normalizedMode,
                selectedSlot: normalizedSlot
            }
        });
        res.json({ success: true, message: 'Mentorship request sent' });
    }
    catch (error) {
        console.error('Error requesting mentorship:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.requestMentorship = requestMentorship;
const respondToRequest = async (req, res) => {
    try {
        const { requestId, action } = req.params;
        const currentUserId = getAuthUserId(req);
        if (!currentUserId) {
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
        if (request.mentor.userId !== currentUserId) {
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
            where: { id: currentUserId },
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
    }
    catch (error) {
        console.error('Error responding to mentorship request:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.respondToRequest = respondToRequest;
//# sourceMappingURL=mentorshipController.js.map