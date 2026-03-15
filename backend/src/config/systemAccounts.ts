const normalizeEmail = (email?: string | null) => (email || '').trim().toLowerCase();

const DEFAULT_HIDDEN_ACCOUNT_EMAILS = ['futurist.raghav@gmail.com'];

const parseEmailList = (value?: string) => {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
};

export const getHiddenSystemAccountEmails = () => {
  const fromEnv = parseEmailList(process.env.HIDDEN_SYSTEM_ACCOUNT_EMAILS);
  const emails = fromEnv.length > 0 ? fromEnv : DEFAULT_HIDDEN_ACCOUNT_EMAILS;
  return new Set(emails.map((email) => normalizeEmail(email)));
};

export const isHiddenSystemAccountEmail = (email?: string | null) => {
  return getHiddenSystemAccountEmails().has(normalizeEmail(email));
};
