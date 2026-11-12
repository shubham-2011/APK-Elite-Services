import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from './mongodb';
import User from '@/models/User';

export interface StoredUser {
  _id: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'editor';
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<StoredUser, 'passwordHash'>;

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Default initial users:
// 1. admin -> Admin@ApkElite2026!
// 2. shubhammisra800@gmail.com -> Shubham@ApkElite2026!
// 3. manager@apkeliteservices.in -> ApkElite#Manager2026!
const DEFAULT_INITIAL_USERS: StoredUser[] = [
  {
    _id: 'usr_admin',
    username: 'admin',
    passwordHash: '$2b$10$jjP8lIASzYd8CmCGRLjpXOO.xWBRF3YVf8MvdszMnGFg4VvpdMCe2',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'usr_initial_shubham',
    username: 'shubhammisra800@gmail.com',
    passwordHash: '$2b$10$K/JBGsrPKp4pqAHNlC1DEOOCJy1YY1kXJknYpc3fVjQSsi/2A7Up.',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'usr_initial_manager',
    username: 'manager@apkeliteservices.in',
    passwordHash: '$2b$10$NlKWbLCsbim5aQY7J2GEYekhjdeMKxknddemwaCFb4cehU26G8X9y',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ensureUsersFile(): StoredUser[] {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }

  if (!fs.existsSync(USERS_FILE)) {
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_INITIAL_USERS, null, 2), 'utf-8');
      return DEFAULT_INITIAL_USERS;
    } catch {
      return DEFAULT_INITIAL_USERS;
    }
  }

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    const users: StoredUser[] = JSON.parse(raw);
    for (const def of DEFAULT_INITIAL_USERS) {
      if (!users.some((u) => u.username.toLowerCase() === def.username.toLowerCase())) {
        users.unshift(def);
      }
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return users;
  } catch {
    return DEFAULT_INITIAL_USERS;
  }
}

export async function findUserByUsername(username: string): Promise<StoredUser | null> {
  const cleanUsername = username.trim().toLowerCase();

  try {
    await connectToDatabase();
    const doc = await User.findOne({ username: cleanUsername }).lean();
    if (doc) {
      return {
        _id: String(doc._id),
        username: doc.username,
        passwordHash: doc.passwordHash,
        role: doc.role,
        createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : new Date().toISOString(),
      };
    }
  } catch {}

  const fallbackList = ensureUsersFile();
  const match = fallbackList.find((u) => u.username.toLowerCase() === cleanUsername);
  return match || null;
}

export async function listUsers(): Promise<SafeUser[]> {
  try {
    await connectToDatabase();
    const docs = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).lean();
    if (docs && docs.length > 0) {
      return docs.map((d) => ({
        _id: String(d._id),
        username: d.username,
        role: d.role,
        createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
      }));
    }
  } catch {}

  const fallbackList = ensureUsersFile();
  return fallbackList.map(({ passwordHash: _, ...safe }) => safe);
}

export async function createUser(
  usernameInput: string,
  passwordInput: string,
  role: 'admin' | 'editor' = 'admin'
): Promise<{ success: boolean; user?: SafeUser; error?: string }> {
  const username = usernameInput.trim().toLowerCase();

  if (!username || username.length < 3 || username.length > 60) {
    return { success: false, error: 'Username must be between 3 and 60 characters.' };
  }

  if (!passwordInput || passwordInput.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const existing = await findUserByUsername(username);
  if (existing) {
    return { success: false, error: 'A user with this username already exists.' };
  }

  const passwordHash = await bcrypt.hash(passwordInput, 10);
  const now = new Date().toISOString();
  let createdId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  try {
    await connectToDatabase();
    const doc = await User.create({ username, passwordHash, role });
    createdId = String(doc._id);
  } catch {}

  // Always sync to local fallback store
  const fallbackList = ensureUsersFile();
  const newRecord: StoredUser = {
    _id: createdId,
    username,
    passwordHash,
    role,
    createdAt: now,
    updatedAt: now,
  };
  fallbackList.push(newRecord);
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(fallbackList, null, 2), 'utf-8');
  } catch {}

  return {
    success: true,
    user: {
      _id: createdId,
      username,
      role,
      createdAt: now,
      updatedAt: now,
    },
  };
}

export async function updateUserPassword(
  usernameOrId: string,
  newPasswordInput: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPasswordInput || newPasswordInput.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters long.' };
  }

  const passwordHash = await bcrypt.hash(newPasswordInput, 10);
  const now = new Date().toISOString();

  let updatedInMongo = false;
  try {
    await connectToDatabase();
    const res = await User.updateOne(
      { $or: [{ username: usernameOrId.trim().toLowerCase() }, { _id: usernameOrId }] },
      { $set: { passwordHash, updatedAt: new Date() } }
    );
    if (res.matchedCount > 0) updatedInMongo = true;
  } catch {}

  // Update fallback store
  const fallbackList = ensureUsersFile();
  const target = fallbackList.find(
    (u) => u.username.toLowerCase() === usernameOrId.trim().toLowerCase() || u._id === usernameOrId
  );

  if (target) {
    target.passwordHash = passwordHash;
    target.updatedAt = now;
    try {
      fs.writeFileSync(USERS_FILE, JSON.stringify(fallbackList, null, 2), 'utf-8');
    } catch {}
    return { success: true };
  }

  if (updatedInMongo) {
    return { success: true };
  }

  return { success: false, error: 'User not found.' };
}
