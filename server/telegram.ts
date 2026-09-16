import https from 'https';

export interface TelegramConfig {
  bot_token: string;
  chat_id: string; // e.g. @arabiyyarovers or -100123456789
  channel_username?: string;
  enabled: boolean;
  announcement_chat_id?: string;
}

let runtimeTelegramConfig: TelegramConfig = {
  bot_token: process.env.TELEGRAM_BOT_TOKEN || '',
  chat_id: process.env.TELEGRAM_CHAT_ID || '@arabiyyarovers',
  channel_username: process.env.TELEGRAM_CHANNEL || '@asgmembersbot',
  enabled: process.env.TELEGRAM_ENABLED === 'true' || false,
  announcement_chat_id: process.env.TELEGRAM_ANNOUNCEMENT_CHAT_ID || ''
};

// Global in-memory cache to map Telegram handles and mobile numbers to live numeric Chat IDs
export const resolvedTelegramChats = new Map<string, number>();
export const resolvedMobileChats = new Map<string, number>();

export function getTelegramConfig(): TelegramConfig {
  return { ...runtimeTelegramConfig };
}

export function updateTelegramConfig(newConfig: Partial<TelegramConfig>): void {
  runtimeTelegramConfig = {
    ...runtimeTelegramConfig,
    ...newConfig
  };
}

// Low-level helper to execute HTTPS requests to Telegram Bot API
function requestTelegramApi(endpoint: string, payload: any, customToken?: string): Promise<any> {
  const token = customToken || runtimeTelegramConfig.bot_token;
  if (!token) {
    return Promise.reject(new Error('Telegram Bot Token is not configured.'));
  }

  const cleanToken = token.trim();
  const data = JSON.stringify(payload);

  const options: https.RequestOptions = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${cleanToken}/${endpoint}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    },
    timeout: 10000
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300 && parsed.ok) {
            resolve(parsed);
          } else {
            const desc = parsed.description || `HTTP ${res.statusCode}: ${body}`;
            reject(new Error(`Telegram API Error: ${desc}`));
          }
        } catch (err: any) {
          reject(new Error(`Failed to parse Telegram API response: ${err.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`Telegram connection error: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram API connection timed out (10s limit).'));
    });

    req.write(data);
    req.end();
  });
}

// Verify Bot token and get Bot details
export async function verifyTelegramBot(botToken?: string): Promise<{ success: boolean; botName?: string; username?: string; message: string }> {
  const token = botToken || runtimeTelegramConfig.bot_token;
  if (!token || !token.trim()) {
    return {
      success: false,
      message: 'Telegram Bot Token is missing. Please provide a valid token from @BotFather.'
    };
  }

  try {
    const result = await requestTelegramApi('getMe', {}, token);
    if (result && result.ok && result.result) {
      return {
        success: true,
        botName: result.result.first_name,
        username: `@${result.result.username}`,
        message: `Successfully connected to bot: ${result.result.first_name} (@${result.result.username})`
      };
    }
    return {
      success: false,
      message: 'Invalid response from Telegram API.'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to connect to Telegram Bot API.'
    };
  }
}

// Send a test message
export async function sendTelegramTestMessage(options?: { bot_token?: string; chat_id?: string; customMessage?: string }): Promise<{ success: boolean; message: string; result?: any }> {
  const token = options?.bot_token || runtimeTelegramConfig.bot_token;
  const chatId = options?.chat_id || runtimeTelegramConfig.chat_id || runtimeTelegramConfig.channel_username;
  
  if (!token || !token.trim()) {
    return { success: false, message: 'Please provide a Telegram Bot Token.' };
  }
  if (!chatId || !chatId.trim()) {
    return { success: false, message: 'Please provide a Target Chat ID or Channel Username (e.g. @ArabiyyaRovers).' };
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  const text = options?.customMessage || `⚜️ <b>Arabiyya Rover Council</b>\n\n✅ <b>Telegram Integration Test Message</b>\n\nThis confirms that the Arabiyya Members system is successfully linked with this Telegram channel/group.\n\n📅 <i>Timestamp:</i> ${timestamp} UTC\n👤 <i>Dispatched by:</i> Secretary of Arabiyya Rover Council\n\n<i>Yours in Scouting,\nArabiyya Rovers</i>`;

  try {
    const res = await requestTelegramApi('sendMessage', {
      chat_id: chatId.trim(),
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    }, token);

    return {
      success: true,
      message: `Test message successfully posted to ${chatId}! Message ID: ${res.result?.message_id || 'N/A'}`,
      result: res.result
    };
  } catch (error: any) {
    const rawError = error.message || '';
    let userFriendlyMessage = `Failed to dispatch Telegram message: ${rawError}`;

    if (rawError.includes("bot can't send messages to the bot")) {
      userFriendlyMessage = `Telegram Error: The Target Chat ID is set to the bot's own username (${chatId}). A Telegram bot cannot send messages to itself.\n\nFix: Enter your Telegram Channel/Group username (e.g. @arabiyyarovers) or numeric ID (e.g. -100123456789) in "Target Channel / Group ID", then add your bot to that channel/group as an Administrator with permission to post messages.`;
    } else if (rawError.includes('Forbidden') || rawError.includes('Unauthorized') || rawError.includes('not a member')) {
      userFriendlyMessage = `Telegram Permission Error: The bot does not have access to send messages to ${chatId}.\n\nFix: Open your Telegram Channel or Group, go to Settings > Administrators > Add Administrator, search for your bot, and grant "Post Messages" permission.`;
    }

    return {
      success: false,
      message: userFriendlyMessage
    };
  }
}

// Dispatch general announcement or event alert to Telegram
export async function broadcastToTelegram(params: {
  title: string;
  message: string;
  category?: string;
  secretaryName?: string;
  actionUrl?: string;
  chatId?: string;
}): Promise<{ success: boolean; message: string; messageId?: number }> {
  if (!runtimeTelegramConfig.enabled && !params.chatId) {
    return { success: false, message: 'Telegram dispatch is currently disabled in system settings.' };
  }

  const token = runtimeTelegramConfig.bot_token;
  const targetChat = params.chatId || runtimeTelegramConfig.announcement_chat_id || runtimeTelegramConfig.chat_id || runtimeTelegramConfig.channel_username;

  if (!token || !targetChat) {
    return { success: false, message: 'Telegram Bot Token or Channel Chat ID is not configured.' };
  }

  const secName = params.secretaryName || 'Ahmed Nazih Nafiz';
  const categoryBadge = params.category ? `[${params.category.toUpperCase()}]` : '⚜️ ANNOUNCEMENT';

  let formattedText = `<b>${categoryBadge} ${params.title}</b>\n\n`;
  formattedText += `${params.message}\n\n`;
  if (params.actionUrl) {
    formattedText += `🔗 <a href="${params.actionUrl}">Open Link in Arabiyya Members</a>\n\n`;
  }
  formattedText += `—\n<i>Yours in Scouting,</i>\n<b>${secName}</b>\nSecretary of Arabiyya Rover Council\n#ArabiyyaRovers`;

  try {
    const res = await requestTelegramApi('sendMessage', {
      chat_id: targetChat.trim(),
      text: formattedText,
      parse_mode: 'HTML'
    }, token);

    return {
      success: true,
      message: `Dispatched to Telegram channel ${targetChat}`,
      messageId: res.result?.message_id
    };
  } catch (error: any) {
    console.error('[Telegram Broadcast Error]:', error);
    const rawError = error.message || '';
    let userFriendlyMessage = rawError || 'Failed to dispatch Telegram announcement.';
    
    if (rawError.includes("bot can't send messages to the bot")) {
      userFriendlyMessage = `Target Chat ID is set to the bot's own username (${targetChat}). Please configure your Channel/Group username (e.g. @arabiyyarovers) in Settings.`;
    }
    
    return {
      success: false,
      message: userFriendlyMessage
    };
  }
}

// Telegram Bot Private DM OTP Dispatcher (Primary: Telegram Tag, Fallback: Mobile Number)
export async function sendTelegramOtp(options: {
  toRecipient?: { fullName?: string; telegramTag?: string; telegramNumber?: string; mobileNumber?: string; phoneNumber?: string; email?: string };
  otp: string;
  purpose: 'tracking' | 'password-reset' | 'verification';
  targetChatId?: string;
}): Promise<{
  success: boolean;
  message: string;
  simulated?: boolean;
  dispatchedTo?: string;
  requireStart?: boolean;
  botLink?: string;
  botUsername?: string;
  otpCode?: string;
}> {
  const token = runtimeTelegramConfig.bot_token;
  
  // Clean bot handle and bot link for users to /start
  const rawBotHandle = runtimeTelegramConfig.channel_username || '@asgmembersbot';
  const cleanBotUsername = rawBotHandle.replace(/^@/, '') || 'asgmembersbot';
  const botUsername = `@${cleanBotUsername}`;
  const botLink = `https://t.me/${cleanBotUsername}`;

  // 1. Primary Target: Telegram Handle (@username)
  let primaryTarget: string | undefined = undefined;
  if (options.toRecipient?.telegramTag && options.toRecipient.telegramTag.trim()) {
    const rawTag = options.toRecipient.telegramTag.trim();
    if (rawTag.toLowerCase() !== '@arabiyyarovers' && rawTag.toLowerCase() !== 'arabiyyarovers') {
      primaryTarget = rawTag.startsWith('@') ? rawTag : `@${rawTag}`;
    } else {
      console.log(`[Telegram Private DM Filter]: Disallowing public channel tag "${rawTag}" as a private member handle.`);
    }
  }

  // 2. Secondary Fallback Target: Mobile Number or Telegram Number
  let secondaryTarget: string | undefined = undefined;
  const rawMobile = options.toRecipient?.telegramNumber || options.toRecipient?.mobileNumber || options.toRecipient?.phoneNumber;
  if (rawMobile && rawMobile.trim()) {
    secondaryTarget = rawMobile.trim();
  }

  // If explicit non-group targetChatId passed
  if (!primaryTarget && options.targetChatId && !options.targetChatId.startsWith('-')) {
    primaryTarget = options.targetChatId;
  }

  const isTracking = options.purpose === 'tracking';
  const isPwReset = options.purpose === 'password-reset';
  const purposeTitle = isTracking 
    ? 'Application Tracking Verification' 
    : isPwReset 
      ? 'Account Password Reset' 
      : 'Identity Verification';

  const recipientName = options.toRecipient?.fullName || 'Member';

  const text = `The OTP for Arabiyya Members Portal is: <code>${options.otp}</code>, valid for 5 Minutes. Do not share your OTP with anyone.\n\nArabiyya Members`;

  // If neither Telegram tag nor mobile number is available on profile
  if (!primaryTarget && !secondaryTarget) {
    console.log(`[Telegram Bot OTP]: No Telegram handle or mobile number registered for ${recipientName}. Code generated: ${options.otp}`);
    return {
      success: true,
      simulated: true,
      requireStart: true,
      botLink,
      botUsername,
      otpCode: options.otp,
      message: `No Telegram handle or mobile number registered on your member profile. Please update your profile or click ${botLink} and send /start.`
    };
  }

  // If bot token is missing, simulate primary delivery
  if (!token || !token.trim()) {
    const targetDisplay = primaryTarget || secondaryTarget;
    console.log(`[Telegram Private Bot OTP Simulated]: Token not set. OTP ${options.otp} for ${recipientName} (${targetDisplay})`);
    return {
      success: true,
      simulated: true,
      botLink,
      botUsername,
      dispatchedTo: targetDisplay,
      otpCode: options.otp,
      message: `OTP generated (${options.otp}). Telegram Bot simulates private DM delivery to ${targetDisplay}.`
    };
  }

  // --- TELEGRAM ID RESOLUTION LAYER ---
  // Resolve usernames (@username) or mobile numbers into their numeric Telegram Chat IDs using cache & live bot updates
  const originalPrimary = primaryTarget;
  const originalSecondary = secondaryTarget;

  let updatesLoaded = false;
  const ensureUpdatesLoaded = async () => {
    if (updatesLoaded) return;
    try {
      console.log(`[Telegram Bot OTP]: Pulling getUpdates to resolve handles...`);
      const updatesRes = await requestTelegramApi('getUpdates', { limit: 100 }, token);
      if (updatesRes && updatesRes.ok && Array.isArray(updatesRes.result)) {
        for (const update of updatesRes.result) {
          if (!update.message || !update.message.from) continue;
          const fromUser = update.message.from;
          const fromUsername = (fromUser.username || '').trim().toLowerCase();
          const chatId = update.message.chat?.id;
          if (fromUsername && chatId) {
            resolvedTelegramChats.set(fromUsername, chatId);
          }
          if (update.message.contact && update.message.contact.phone_number && chatId) {
            const contactPhone = update.message.contact.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
            resolvedMobileChats.set(contactPhone, chatId);
          }
        }
      }
      updatesLoaded = true;
    } catch (err: any) {
      console.warn(`[Telegram Bot OTP]: Failed to pre-fetch updates: ${err.message}`);
    }
  };

  // Resolve Primary (Telegram Username)
  if (primaryTarget) {
    const cleanTag = primaryTarget.replace(/^@/, '').trim().toLowerCase();
    // If it is not already a pure numeric ID, we need to resolve it
    if (isNaN(Number(cleanTag))) {
      if (resolvedTelegramChats.has(cleanTag)) {
        primaryTarget = resolvedTelegramChats.get(cleanTag)!.toString();
        console.log(`[Telegram Bot OTP]: Resolved cached username @${cleanTag} to numeric ID ${primaryTarget}`);
      } else {
        await ensureUpdatesLoaded();
        if (resolvedTelegramChats.has(cleanTag)) {
          primaryTarget = resolvedTelegramChats.get(cleanTag)!.toString();
          console.log(`[Telegram Bot OTP]: Resolved username @${cleanTag} from live updates to numeric ID ${primaryTarget}`);
        } else {
          console.log(`[Telegram Bot OTP]: Could not resolve username @${cleanTag} to numeric ID yet.`);
        }
      }
    }
  }

  // Resolve Secondary (Mobile Number)
  if (secondaryTarget) {
    const cleanMobile = secondaryTarget.replace(/\s+/g, '').replace(/^\+/, '');
    // If it is not already a pure numeric ID, we need to resolve it
    if (isNaN(Number(cleanMobile))) {
      if (resolvedMobileChats.has(cleanMobile)) {
        secondaryTarget = resolvedMobileChats.get(cleanMobile)!.toString();
        console.log(`[Telegram Bot OTP]: Resolved cached mobile ${cleanMobile} to numeric ID ${secondaryTarget}`);
      } else {
        await ensureUpdatesLoaded();
        if (resolvedMobileChats.has(cleanMobile)) {
          secondaryTarget = resolvedMobileChats.get(cleanMobile)!.toString();
          console.log(`[Telegram Bot OTP]: Resolved mobile ${cleanMobile} from live updates to numeric ID ${secondaryTarget}`);
        } else {
          console.log(`[Telegram Bot OTP]: Could not resolve mobile ${cleanMobile} to numeric ID yet.`);
        }
      }
    }
  }

  // Attempt 1: Send to Primary Target (Telegram Username)
  if (primaryTarget) {
    try {
      await requestTelegramApi('sendMessage', {
        chat_id: primaryTarget,
        text,
        parse_mode: 'HTML'
      }, token);

      console.log(`[Telegram Bot OTP Success]: Private OTP sent to member Telegram handle ${primaryTarget}`);
      return {
        success: true,
        dispatchedTo: primaryTarget,
        botLink,
        botUsername,
        message: `OTP successfully sent to your private Telegram handle (${primaryTarget}).`
      };
    } catch (primaryErr: any) {
      const errMsg = primaryErr.message || '';
      if (errMsg.includes('chat not found')) {
        console.log(`[Telegram DM Notice]: Primary handle ${primaryTarget} unavailable or uninitiated. Trying secondary contact...`);
      } else {
        console.warn(`[Telegram Primary Tag Exception for ${primaryTarget}]: ${errMsg}. Trying secondary contact...`);
      }
    }
  }

  // Attempt 2: Fallback to Secondary Target (Mobile Number / Phone Contact)
  if (secondaryTarget && secondaryTarget !== primaryTarget) {
    try {
      await requestTelegramApi('sendMessage', {
        chat_id: secondaryTarget,
        text,
        parse_mode: 'HTML'
      }, token);

      console.log(`[Telegram Bot OTP Fallback Success]: Private OTP sent to member mobile contact ${secondaryTarget}`);
      return {
        success: true,
        dispatchedTo: secondaryTarget,
        botLink,
        botUsername,
        message: `Primary handle unreachable. OTP sent to your registered mobile contact (${secondaryTarget}).`
      };
    } catch (secErr: any) {
      const errMsg = secErr.message || '';
      if (errMsg.includes('chat not found')) {
        console.log(`[Telegram DM Notice]: Secondary mobile contact ${secondaryTarget} requires initial bot activation.`);
      } else {
        console.warn(`[Telegram Secondary Mobile Exception for ${secondaryTarget}]: ${errMsg}`);
      }
    }
  }

  // If BOTH primary and fallback attempts failed:
  // Prompt member to start conversation with the chatbot!
  const attemptedTargets = [primaryTarget, secondaryTarget].filter(Boolean).join(' / ');
  console.log(`[Telegram Private DM Require Start]: Could not DM ${attemptedTargets}. User must tap /start on ${botLink}. Code generated: ${options.otp}`);

  return {
    success: true,
    simulated: true,
    requireStart: true,
    botLink,
    botUsername,
    dispatchedTo: attemptedTargets,
    otpCode: options.otp,
    message: `Attempted sending private OTP to ${attemptedTargets}. Please click ${botLink} and tap /start on the bot to enable private DMs.`
  };
}

export async function checkTelegramStart(telegramTag: string, mobileNumber?: string): Promise<{
  success: boolean;
  started: boolean;
  chatId?: number;
  firstName?: string;
  message: string;
}> {
  const token = runtimeTelegramConfig.bot_token;
  if (!token) {
    return {
      success: false,
      started: false,
      message: 'Telegram Bot is not configured yet (missing token).'
    };
  }

  const cleanTag = telegramTag.replace(/^@/, '').trim().toLowerCase();
  const cleanMobile = mobileNumber ? mobileNumber.replace(/\s+/g, '').replace(/^\+/, '') : '';

  try {
    const updatesRes = await requestTelegramApi('getUpdates', { limit: 100 }, token);
    if (updatesRes && updatesRes.ok && Array.isArray(updatesRes.result)) {
      const updates = updatesRes.result;
      for (const update of updates) {
        if (!update.message) continue;
        const fromUser = update.message.from;
        if (!fromUser) continue;

        const fromUsername = (fromUser.username || '').trim().toLowerCase();
        const fromFirstName = fromUser.first_name || '';
        const chatId = update.message.chat?.id;

        // Cache any seen usernames and chatIds
        if (fromUsername && chatId) {
          resolvedTelegramChats.set(fromUsername, chatId);
        }

        if (cleanTag && fromUsername === cleanTag) {
          if (chatId) resolvedTelegramChats.set(cleanTag, chatId);
          return {
            success: true,
            started: true,
            chatId,
            firstName: fromFirstName,
            message: `Successfully verified! User @${fromUser.username} (${fromFirstName}) has started the bot.`
          };
        }

        if (update.message.contact && update.message.contact.phone_number) {
          const contactPhone = update.message.contact.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
          if (chatId) resolvedMobileChats.set(contactPhone, chatId);
          if (cleanMobile && contactPhone.includes(cleanMobile)) {
            return {
              success: true,
              started: true,
              chatId,
              firstName: fromFirstName,
              message: `Successfully verified! Shared contact number matched registered mobile.`
            };
          }
        }
      }
    }

    return {
      success: true,
      started: false,
      message: 'No recent /start or active interaction found for this Telegram ID in the bot updates. Please click the link, tap /start on the bot, then click "Verify Connection".'
    };
  } catch (error: any) {
    console.error('[checkTelegramStart error]:', error);
    return {
      success: false,
      started: false,
      message: `Failed to read bot logs: ${error.message || 'Please make sure you tapped /start first.'}`
    };
  }
}

