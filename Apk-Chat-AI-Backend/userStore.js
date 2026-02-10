import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const DIGESTS_FILE = path.join(__dirname, 'data', 'digests.json');

// Ensure data directory exists
await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
export async function getAllUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet
    return [];
  }
}

/**
 * Save user digest settings
 * @param {Object} settings - User settings
 */
export async function saveUserSettings(settings) {
  const users = await getAllUsers();
  
  // Find and update or add new user
  const index = users.findIndex(u => u.userId === settings.userId);
  if (index >= 0) {
    users[index] = { ...users[index], ...settings, updatedAt: new Date().toISOString() };
  } else {
    users.push({ ...settings, createdAt: new Date().toISOString() });
  }
  
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  console.log(`✅ Settings saved for user: ${settings.userId}`);
  return users[index >= 0 ? index : users.length - 1];
}

/**
 * Get users who should receive digest at given UTC hour
 * @param {number} utcHour - Hour in UTC (0-23)
 * @returns {Promise<Array>} Users scheduled for this hour
 */
export async function getUsersForHour(utcHour) {
  const users = await getAllUsers();
  
  return users.filter(user => {
    if (!user.digestEnabled) return false;
    
    // user.digestTimeUTC is the hour in UTC (0-23)
    return user.digestTimeUTC === utcHour;
  });
}

/**
 * Save a generated digest to history
 * @param {string} userId - User ID
 * @param {Object} digest - Digest object
 */
export async function saveDigest(userId, digest) {
  try {
    let digests = [];
    try {
      const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
      digests = JSON.parse(data);
    } catch (e) {
      // File doesn't exist yet
    }
    
    digests.push({
      ...digest,
      userId,
      deliveredAt: new Date().toISOString(),
    });
    
    // Keep only last 100 digests per user to avoid file bloat
    const userDigests = digests.filter(d => d.userId === userId);
    if (userDigests.length > 100) {
      digests = digests.filter(d => d.userId !== userId).concat(userDigests.slice(-100));
    }
    
    await fs.writeFile(DIGESTS_FILE, JSON.stringify(digests, null, 2));
    console.log(`✅ Digest saved for user: ${userId}`);
    
  } catch (error) {
    console.error('❌ Failed to save digest:', error.message);
  }
}

/**
 * Get digest history for a user
 * @param {string} userId - User ID
 * @param {number} limit - Max number of digests to return
 * @returns {Promise<Array>} Array of past digests
 */
export async function getUserDigests(userId, limit = 30) {
  try {
    const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
    const digests = JSON.parse(data);
    
    return digests
      .filter(d => d.userId === userId)
      .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
      .slice(0, limit);
      
  } catch (error) {
    return [];
  }
}

export async function getDigestById(digestId) {
  try {
    const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
    const digests = JSON.parse(data);
    
    return digests.find(d => d.id === digestId) || null;
    
  } catch (error) {
    return null;
  }
}

/**
 * Delete a specific digest
 * @param {string} digestId 
 * @returns {Promise<boolean>} True if deleted
 */
export async function deleteDigest(digestId) {
  try {
    const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
    let digests = JSON.parse(data);
    
    const initialLength = digests.length;
    digests = digests.filter(d => d.id !== digestId);
    
    if (digests.length !== initialLength) {
      await fs.writeFile(DIGESTS_FILE, JSON.stringify(digests, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Delete digest error:', error);
    return false;
  }
}

/**
 * Clear all digests for a user
 * @param {string} userId 
 * @returns {Promise<boolean>} True if deleted any
 */
export async function clearUserDigests(userId) {
  try {
    const data = await fs.readFile(DIGESTS_FILE, 'utf-8');
    let digests = JSON.parse(data);
    
    const initialLength = digests.length;
    digests = digests.filter(d => d.userId !== userId);
    
    if (digests.length !== initialLength) {
      await fs.writeFile(DIGESTS_FILE, JSON.stringify(digests, null, 2));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Clear user digests error:', error);
    return false;
  }
}
