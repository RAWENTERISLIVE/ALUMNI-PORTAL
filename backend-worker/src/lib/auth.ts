import * as bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

export const verifyPassword = async (password: string, storedHash: string) => {
  // Support both Bcrypt and Plaintext (for initial seeding/migration)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return await bcrypt.compare(password, storedHash);
  }
  return password === storedHash;
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const createJWT = async (userId: string, email: string, role: string, secret: string) => {
  const secretKey = new TextEncoder().encode(secret);
  const token = await new SignJWT({ id: userId, email, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  return token;
};

export const verifyJWT = async (token: string, secret: string) => {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    return payload as any;
  } catch {
    return null;
  }
};
