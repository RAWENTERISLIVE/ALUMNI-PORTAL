import 'dotenv/config';

/**
 * Utility to retrieve JWT secret from environment variables.
 * Throws an error if the secret is not defined, preventing the use of insecure defaults.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    // We throw a hard error to prevent the application from running with insecure defaults
    throw new Error('SECURITY FATAL: JWT_SECRET environment variable is not set. Please check your .env file.');
  }

  return secret;
};
