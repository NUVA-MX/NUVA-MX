import 'server-only';
import bcrypt from 'bcryptjs';
import { BCRYPT_COST } from './emails';

/**
 * Hash of a random throwaway value. Compared against when the email is unknown or not allowed,
 * so a failed login takes the same time whether or not the account exists.
 */
const DUMMY_HASH = '$2b$12$9bdCMvvLcmDII6730in6V.Y/OURzk.vL8NTlEhYp3c9HiRNvnee9m';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Burns the same time as a real compare and always returns false. */
export async function verifyAgainstDummy(password: string): Promise<false> {
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}
