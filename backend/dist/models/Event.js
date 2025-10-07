"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const eventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        required: true,
        maxlength: 2000
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    time: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    organizer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }],
    maxAttendees: {
        type: Number,
        min: 1,
        max: 10000
    },
    isVirtual: {
        type: Boolean,
        default: false
    },
    meetingLink: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        enum: ['networking', 'career', 'academic', 'social', 'workshop', 'other'],
        default: 'other'
    },
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
        default: 'upcoming'
    },
    imageUrl: {
        type: String,
        trim: true
    },
    isSchoolEvent: {
        type: Boolean,
        default: false
    },
    tags: [{
            type: String,
            trim: true,
            maxlength: 50
        }]
}, {
    timestamps: true
});
eventSchema.index({ date: 1, status: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ attendees: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ isSchoolEvent: 1 });
exports.default = (0, mongoose_1.model)('Event', eventSchema);
//# sourceMappingURL=Event.js.map