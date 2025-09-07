import { Document, Types } from 'mongoose';
export interface IEvent extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    date: Date;
    endDate?: Date;
    time: string;
    location: string;
    organizer: Types.ObjectId;
    attendees: Types.ObjectId[];
    maxAttendees?: number;
    isVirtual: boolean;
    meetingLink?: string;
    category: 'networking' | 'career' | 'academic' | 'social' | 'workshop' | 'other';
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    imageUrl?: string;
    isSchoolEvent: boolean;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: import("mongoose").Model<IEvent, {}, {}, {}, Document<unknown, {}, IEvent, {}> & IEvent & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Event.d.ts.map