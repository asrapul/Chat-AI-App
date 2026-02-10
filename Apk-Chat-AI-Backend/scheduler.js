import schedule from 'node-schedule';
import { generateDigest } from './digestService.js';
import { sendDigestNotification } from './pushService.js';
import { getUsersForHour, saveDigest } from './userStore.js';

/**
 * Start the digest scheduler
 * Runs every hour at :00 to check for users who need digests
 */
export function startDigestScheduler() {
  console.log('🕐 Starting digest scheduler...');
  
  // Run every hour at :00 minutes
  schedule.scheduleJob('0 * * * *', async () => {
    const currentHour = new Date().getUTCHours();
    console.log(`\n⏰ Hourly digest check (UTC Hour: ${currentHour})`);
    
    try {
      const users = await getUsersForHour(currentHour);
      console.log(`👥 Found ${users.length} users scheduled for this hour`);
      
      if (users.length === 0) {
        console.log('   No digests to send.');
        return;
      }
      
      // Process each user
      for (const user of users) {
        await processUserDigest(user);
        
        // Add small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log(`✅ Digest delivery complete for ${users.length} users\n`);
      
    } catch (error) {
      console.error('❌ Scheduler error:', error.message);
    }
  });
  
  console.log('✅ Digest scheduler started successfully');
  console.log('   Checking every hour at :00 for scheduled digests\n');
}

/**
 * Process digest for a single user
 * @param {Object} user - User object with settings
 */
async function processUserDigest(user) {
  const { userId, topic, customPrompt, pushToken } = user;
  
  try {
    console.log(`📰 Generating digest for ${userId} (${topic})...`);
    
    // Generate digest with Google Grounding
    const digest = await generateDigest(topic, customPrompt);
    
    // Save to history
    await saveDigest(userId, digest);
    
    // Send push notification
    if (pushToken) {
      const result = await sendDigestNotification(pushToken, digest);
      
      if (result.success) {
        console.log(`   ✅ Digest sent to ${userId}`);
      } else {
        console.error(`   ❌ Failed to send notification to ${userId}:`, result.error);
      }
    } else {
      console.warn(`   ⚠️ No push token for ${userId}, digest saved but not sent`);
    }
    
  } catch (error) {
    console.error(`   ❌ Failed to process digest for ${userId}:`, error.message);
  }
}

/**
 * Manual digest delivery (for testing)
 * @param {string} userId - User ID to send digest to
 * @param {Object} [overrides] - Optional overrides for topic/customPrompt from request body
 */
export async function sendManualDigest(userId, overrides = {}) {
  const { getAllUsers, saveUserSettings } = await import('./userStore.js');
  const users = await getAllUsers();
  let user = users.find(u => u.userId === userId);
  
  // If user doesn't exist, create with defaults
  if (!user) {
    console.log(`📝 Creating default settings for user: ${userId}`);
    user = {
      userId,
      topic: overrides.topic || 'Teknologi',
      customPrompt: overrides.customPrompt || null,
      digestEnabled: false,
      digestTimeUTC: 8,
    };
    await saveUserSettings(user);
  }
  
  // Apply overrides from request body (Generate Now button sends current form values)
  if (overrides.topic) {
    user = { ...user, topic: overrides.topic };
  }
  if (overrides.customPrompt !== undefined) {
    user = { ...user, customPrompt: overrides.customPrompt };
  }
  
  // Manual digest bypasses digestEnabled check - user explicitly requested it
  console.log(`📰 Manual digest requested for ${userId} (topic: ${user.topic})`);
  
  await processUserDigest(user);
  return { success: true, message: 'Manual digest sent successfully' };
}
