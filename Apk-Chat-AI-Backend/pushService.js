/**
 * Push Notification Service using Expo Push API
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification to user's device
 * @param {string} pushToken - Expo push token
 * @param {Object} notification - Notification payload
 */
export async function sendPushNotification(pushToken, notification) {
  if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
    console.warn('⚠️ Invalid push token:', pushToken);
    return { success: false, error: 'Invalid push token' };
  }
  
  const message = {
    to: pushToken,
    sound: 'default',
    title: notification.title || '📰 Daily Digest',
    body: notification.body,
    data: notification.data || {},
    priority: 'high',
    channelId: 'digest', // For Android notification channels
  };
  
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
    
    const result = await response.json();
    
    if (result.data && result.data[0]?.status === 'ok') {
      console.log(`✅ Push notification sent to ${pushToken.substring(0, 20)}...`);
      return { success: true, result };
    } else {
      console.error('❌ Push notification failed:', result);
      return { success: false, error: result };
    }
    
  } catch (error) {
    console.error('❌ Push notification error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send digest notification to user
 * @param {string} pushToken - Expo push token
 * @param {Object} digest - Digest object
 */
export async function sendDigestNotification(pushToken, digest) {
  const preview = digest.content.substring(0, 100).trim() + '...';
  
  return sendPushNotification(pushToken, {
    title: `📰 ${digest.topic} Digest`,
    body: preview,
    data: {
      type: 'digest',
      digestId: digest.id,
      topic: digest.topic,
    },
  });
}

/**
 * Test push notification
 */
export async function testPushNotification(pushToken) {
  return sendPushNotification(pushToken, {
    title: '🧪 Test Notification',
    body: 'This is a test notification from Monox AI!',
    data: { test: true },
  });
}
