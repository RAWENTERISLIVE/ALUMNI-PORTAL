type NotificationInput = {
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
};
export declare const createNotification: ({ userId, title, message, type, actionUrl, metadata }: NotificationInput) => Promise<boolean>;
export {};
//# sourceMappingURL=notifications.d.ts.map