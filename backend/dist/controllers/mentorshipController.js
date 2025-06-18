"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.respondToRequest = exports.requestMentorship = exports.getMentorshipProfile = exports.becomeMentor = exports.getMentors = void 0;
const MentorshipProfile_1 = __importDefault(require("../models/MentorshipProfile"));
const getMentors = async (_req, res) => {
    try {
        const mentors = await MentorshipProfile_1.default.find({ isMentor: true, isActive: true }).populate('userId', 'firstName lastName email profilePicture');
        res.json({ success: true, data: mentors });
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
        let profile = await MentorshipProfile_1.default.findOne({ userId });
        if (profile) {
            profile.isMentor = true;
            Object.assign(profile, profileData);
        }
        else {
            profile = new MentorshipProfile_1.default({ ...profileData, userId, isMentor: true });
        }
        await profile.save();
        res.json({ success: true, data: profile });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
exports.becomeMentor = becomeMentor;
const getMentorshipProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await MentorshipProfile_1.default.findOne({ userId });
        res.json({ success: true, data: profile });
    }
    catch (error) {
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