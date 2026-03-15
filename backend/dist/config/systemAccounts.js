"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHiddenSystemAccountEmail = exports.getHiddenSystemAccountEmails = void 0;
const normalizeEmail = (email) => (email || '').trim().toLowerCase();
const DEFAULT_HIDDEN_ACCOUNT_EMAILS = ['futurist.raghav@gmail.com'];
const parseEmailList = (value) => {
    if (!value)
        return [];
    return value
        .split(',')
        .map((entry) => normalizeEmail(entry))
        .filter(Boolean);
};
const getHiddenSystemAccountEmails = () => {
    const fromEnv = parseEmailList(process.env.HIDDEN_SYSTEM_ACCOUNT_EMAILS);
    const emails = fromEnv.length > 0 ? fromEnv : DEFAULT_HIDDEN_ACCOUNT_EMAILS;
    return new Set(emails.map((email) => normalizeEmail(email)));
};
exports.getHiddenSystemAccountEmails = getHiddenSystemAccountEmails;
const isHiddenSystemAccountEmail = (email) => {
    return (0, exports.getHiddenSystemAccountEmails)().has(normalizeEmail(email));
};
exports.isHiddenSystemAccountEmail = isHiddenSystemAccountEmail;
//# sourceMappingURL=systemAccounts.js.map