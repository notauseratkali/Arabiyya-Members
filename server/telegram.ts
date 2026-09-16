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
  if (runtimeTelegramConfig.bot_token && !pollingActive) {
    startTelegramPolling();
  }
}

// ==========================================
// PRIVATE TELEGRAM DM OTP REGISTRY & DELIVERY
// ==========================================

export interface PendingOtpRecord {
  otp: string;
  expiresAt: number;
  idCard?: string;
  email?: string;
  telegramTag?: string;
  mobileNumber?: string;
  purpose: 'tracking' | 'password-reset' | 'verification';
  fullName?: string;
  delivered: boolean;
  createdAt: number;
}

// In-memory registry of active pending OTPs awaiting user to start the bot
export const pendingOtpsRegistry = new Map<string, PendingOtpRecord>();

export function normalizeTag(tag?: string): string {
  if (!tag) return '';
  return tag.toLowerCase().replace(/^@/, '').trim();
}

export function normalizeMobile(mobile?: string): string {
  if (!mobile) return '';
  return mobile.replace(/\s+/g, '').replace(/^\+/, '').trim();
}

export function registerPendingOtp(data: PendingOtpRecord): void {
  const now = Date.now();
  // Purge expired records
  for (const [key, item] of pendingOtpsRegistry.entries()) {
    if (item.expiresAt < now) {
      pendingOtpsRegistry.delete(key);
    }
  }

  if (data.idCard) {
    pendingOtpsRegistry.set(`id:${data.idCard.toUpperCase().trim()}`, data);
  }
  if (data.telegramTag) {
    const cleanTag = normalizeTag(data.telegramTag);
    if (cleanTag) pendingOtpsRegistry.set(`tg:${cleanTag}`, data);
  }
  if (data.mobileNumber) {
    const cleanNum = normalizeMobile(data.mobileNumber);
    if (cleanNum) pendingOtpsRegistry.set(`mob:${cleanNum}`, data);
  }
}

export function findPendingOtp(params: {
  idCard?: string;
  telegramTag?: string;
  mobileNumber?: string;
}): PendingOtpRecord | null {
  const now = Date.now();
  if (params.idCard) {
    const rec = pendingOtpsRegistry.get(`id:${params.idCard.toUpperCase().trim()}`);
    if (rec && rec.expiresAt > now) return rec;
  }
  if (params.telegramTag) {
    const cleanTag = normalizeTag(params.telegramTag);
    if (cleanTag) {
      const rec = pendingOtpsRegistry.get(`tg:${cleanTag}`);
      if (rec && rec.expiresAt > now) return rec;
    }
  }
  if (params.mobileNumber) {
    const cleanNum = normalizeMobile(params.mobileNumber);
    if (cleanNum) {
      const rec = pendingOtpsRegistry.get(`mob:${cleanNum}`);
      if (rec && rec.expiresAt > now) return rec;
    }
  }
  return null;
}

/**
 * Deliver active pending OTP strictly to user's private Telegram chat ID
 */
export async function deliverPendingOtpToChat(options: {
  chatId: number;
  telegramTag?: string;
  mobileNumber?: string;
  idCardNumber?: string;
  token?: string;
}): Promise<{ delivered: boolean; otp?: string; message?: string }> {
  const botToken = options.token || runtimeTelegramConfig.bot_token;
  if (!botToken) return { delivered: false, message: 'Bot token missing.' };

  // STRICT PRIVATE ONLY: Telegram chat ID MUST be positive (> 0)
  // Negative IDs are groups (-123) or channels (-100123)
  if (options.chatId <= 0) {
    console.warn(`[Telegram Private Only Filter]: Blocked OTP delivery to non-private chat ID ${options.chatId}.`);
    return { delivered: false, message: 'Private Only: OTPs are strictly restricted to personal 1-on-1 Telegram DMs.' };
  }

  const pending = findPendingOtp({
    idCard: options.idCardNumber,
    telegramTag: options.telegramTag,
    mobileNumber: options.mobileNumber
  });

  if (!pending) {
    return { delivered: false, message: 'No active pending OTP found for this user.' };
  }

  if (pending.delivered) {
    return { delivered: true, otp: pending.otp, message: 'OTP already delivered to your private Telegram DM.' };
  }

  const text = `The OTP for Arabiyya Members Portal is: <code>${pending.otp}</code>, valid for 5 Minutes. Do not share your OTP with anyone.\n\n🔒 <i>Sent strictly to your private Telegram DM.</i>\nArabiyya Members`;

  try {
    await requestTelegramApi('sendMessage', {
      chat_id: options.chatId,
      text,
      parse_mode: 'HTML'
    }, botToken);

    pending.delivered = true;
    console.log(`[Telegram Private DM Auto-Delivered]: Pending OTP ${pending.otp} dispatched to private chat ${options.chatId} upon bot start!`);
    return {
      delivered: true,
      otp: pending.otp,
      message: `Verified! The OTP code was delivered to your private Telegram DM.`
    };
  } catch (err: any) {
    console.error(`[Telegram Private DM Delivery Error] for chat ${options.chatId}:`, err.message);
    return {
      delivered: false,
      message: `Failed to deliver OTP: ${err.message}`
    };
  }
}

// Background polling listener to catch /start events instantly
let pollingActive = false;
let lastUpdateOffset = 0;

export function startTelegramPolling(): void {
  if (pollingActive) return;
  pollingActive = true;

  const poll = async () => {
    try {
      const token = runtimeTelegramConfig.bot_token ? runtimeTelegramConfig.bot_token.trim() : '';
      if (token) {
        const payload: any = { limit: 50, timeout: 0 };
        if (lastUpdateOffset > 0) {
          payload.offset = lastUpdateOffset;
        }
        const res = await requestTelegramApi('getUpdates', payload, token);
        if (res && res.ok && Array.isArray(res.result) && res.result.length > 0) {
          for (const update of res.result) {
            lastUpdateOffset = Math.max(lastUpdateOffset, update.update_id + 1);
            if (!update.message) continue;
            const chat = update.message.chat;
            // STRICT: PRIVATE ONLY! Ignore groups and channels
            if (!chat || chat.type !== 'private' || chat.id <= 0) continue;

            const fromUser = update.message.from;
            if (!fromUser) continue;

            const fromUsername = (fromUser.username || '').toLowerCase().trim();
            const fromFirstName = fromUser.first_name || 'Member';
            const chatId = chat.id;
            const text = (update.message.text || '').trim();

            if (fromUsername) resolvedTelegramChats.set(fromUsername, chatId);
            let fromPhone = '';
            if (update.message.contact && update.message.contact.phone_number) {
              fromPhone = update.message.contact.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
              resolvedMobileChats.set(fromPhone, chatId);
            }

            // Check if deep link contains idCard (e.g. /start id_A123456)
            let extractedId: string | undefined = undefined;
            const idMatch = text.match(/\/start\s+id_([a-zA-Z0-9_]+)/i);
            if (idMatch && idMatch[1]) {
              extractedId = idMatch[1];
            }

            if (text.startsWith('/start') || text.startsWith('/otp') || update.message.contact) {
              // INITIATE SAME OTP WHEN BOT IS STARTED!
              const delivery = await deliverPendingOtpToChat({
                chatId,
                telegramTag: fromUsername,
                mobileNumber: fromPhone,
                idCardNumber: extractedId,
                token
              });

              if (!delivery.delivered && text.startsWith('/start')) {
                // Send friendly private DM activation greeting
                const welcomeMsg = `⚜️ <b>Arabiyya Rover Network</b>\n\nWelcome ${fromFirstName}! Your private Telegram connection is now active.\n\n🔒 <b>Private Only:</b> All Arabiyya Portal OTP codes and private notices will be delivered strictly to this personal DM.\n\n<i>Yours in Scouting,\nArabiyya Rovers</i>`;
                try {
                  await requestTelegramApi('sendMessage', {
                    chat_id: chatId,
                    text: welcomeMsg,
                    parse_mode: 'HTML'
                  }, token);
                } catch (wErr) {
                  // ignore
                }
              }
            }
          }
        }
      }
    } catch (err) {
      // ignore transient network errors
    } finally {
      setTimeout(poll, 3000);
    }
  };

  setTimeout(poll, 1500);
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

export interface SendTelegramOtpOptions {
  toRecipient?: {
    idCardNumber?: string;
    fullName?: string;
    telegramTag?: string;
    telegramNumber?: string;
    mobileNumber?: string;
    phoneNumber?: string;
    email?: string;
  };
  idCardNumber?: string;
  otp: string;
  purpose: 'tracking' | 'password-reset' | 'verification';
  targetChatId?: string;
}

// Telegram Bot Private DM OTP Dispatcher (Private Only)
export async function sendTelegramOtp(options: SendTelegramOtpOptions): Promise<{
  success: boolean;
  message: string;
  simulated?: boolean;
  dispatchedTo?: string;
  requireStart?: boolean;
  botLink?: string;
  botUsername?: string;
  otpDelivered?: boolean;
}> {
  const token = runtimeTelegramConfig.bot_token;
  
  // Clean bot handle and bot link for users to /start
  const rawBotHandle = runtimeTelegramConfig.channel_username || '@asgmembersbot';
  const cleanBotUsername = rawBotHandle.replace(/^@/, '') || 'asgmembersbot';
  const botUsername = `@${cleanBotUsername}`;
  
  const idCard = (options.idCardNumber || options.toRecipient?.idCardNumber || '').toUpperCase().trim();
  const cleanIdParam = idCard ? `id_${idCard.replace(/[^a-zA-Z0-9_]/g, '')}` : '';
  const botLink = cleanIdParam 
    ? `https://t.me/${cleanBotUsername}?start=${cleanIdParam}` 
    : `https://t.me/${cleanBotUsername}`;

  // 1. Primary Target: Telegram Handle (@username)
  let primaryTarget: string | undefined = undefined;
  if (options.toRecipient?.telegramTag && options.toRecipient.telegramTag.trim()) {
    const rawTag = options.toRecipient.telegramTag.trim();
    if (rawTag.toLowerCase() !== '@arabiyyarovers' && rawTag.toLowerCase() !== 'arabiyyarovers') {
      primaryTarget = rawTag.startsWith('@') ? rawTag : `@${rawTag}`;
    }
  }

  // 2. Secondary Fallback Target: Mobile Number or Telegram Number
  let secondaryTarget: string | undefined = undefined;
  const rawMobile = options.toRecipient?.telegramNumber || options.toRecipient?.mobileNumber || options.toRecipient?.phoneNumber;
  if (rawMobile && rawMobile.trim()) {
    secondaryTarget = rawMobile.trim();
  }

  // If explicit targetChatId passed
  if (!primaryTarget && options.targetChatId && !options.targetChatId.startsWith('-')) {
    primaryTarget = options.targetChatId;
  }

  // STRICT PRIVATE ONLY: Reject any group / channel negative chat IDs or broadcast channels
  if (primaryTarget && primaryTarget.startsWith('-')) {
    console.warn(`[Telegram Private DM Reject]: Chat ${primaryTarget} is a group/channel. OTPs are private only.`);
    primaryTarget = undefined;
  }
  if (secondaryTarget && secondaryTarget.startsWith('-')) {
    secondaryTarget = undefined;
  }

  const recipientName = options.toRecipient?.fullName || 'Member';
  const text = `The OTP for Arabiyya Members Portal is: <code>${options.otp}</code>, valid for 5 Minutes. Do not share your OTP with anyone.\n\n🔒 <i>Sent strictly to your private Telegram DM.</i>\nArabiyya Members`;

  // Always register in pending OTP registry so when bot is started, the SAME OTP is delivered immediately!
  registerPendingOtp({
    otp: options.otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
    idCard: idCard,
    email: options.toRecipient?.email,
    telegramTag: options.toRecipient?.telegramTag || primaryTarget,
    mobileNumber: rawMobile,
    purpose: options.purpose,
    fullName: recipientName,
    delivered: false,
    createdAt: Date.now()
  });

  // If neither Telegram tag nor mobile number is available on profile
  if (!primaryTarget && !secondaryTarget) {
    console.log(`[Telegram Bot OTP]: No Telegram handle or mobile number registered for ${recipientName}.`);
    return {
      success: true,
      simulated: true,
      requireStart: true,
      botLink,
      botUsername,
      message: `Private Only: OTPs are sent strictly to your private Telegram DM. Please click ${botLink} and send /start.`
    };
  }

  // If bot token is missing, simulate primary delivery
  if (!token || !token.trim()) {
    const targetDisplay = primaryTarget || secondaryTarget;
    console.log(`[Telegram Private Bot OTP]: Token not configured. Simulated dispatch for ${recipientName} (${targetDisplay})`);
    return {
      success: true,
      simulated: true,
      botLink,
      botUsername,
      dispatchedTo: targetDisplay,
      message: `Verification OTP dispatched to Telegram bot for ${targetDisplay}.`
    };
  }

  // --- TELEGRAM ID RESOLUTION LAYER ---
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
          const chat = update.message.chat;
          // STRICT: PRIVATE ONLY! Ignore groups and channels
          if (!chat || chat.type !== 'private' || chat.id <= 0) continue;

          const fromUser = update.message.from;
          const fromUsername = (fromUser.username || '').trim().toLowerCase();
          const chatId = chat.id;
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
    if (isNaN(Number(cleanTag))) {
      if (resolvedTelegramChats.has(cleanTag)) {
        primaryTarget = resolvedTelegramChats.get(cleanTag)!.toString();
        console.log(`[Telegram Bot OTP]: Resolved cached username @${cleanTag} to numeric ID ${primaryTarget}`);
      } else {
        await ensureUpdatesLoaded();
        if (resolvedTelegramChats.has(cleanTag)) {
          primaryTarget = resolvedTelegramChats.get(cleanTag)!.toString();
          console.log(`[Telegram Bot OTP]: Resolved username @${cleanTag} from live updates to numeric ID ${primaryTarget}`);
        }
      }
    }
  }

  // Resolve Secondary (Mobile Number)
  if (secondaryTarget) {
    const cleanMobile = secondaryTarget.replace(/\s+/g, '').replace(/^\+/, '');
    if (isNaN(Number(cleanMobile))) {
      if (resolvedMobileChats.has(cleanMobile)) {
        secondaryTarget = resolvedMobileChats.get(cleanMobile)!.toString();
        console.log(`[Telegram Bot OTP]: Resolved cached mobile ${cleanMobile} to numeric ID ${secondaryTarget}`);
      } else {
        await ensureUpdatesLoaded();
        if (resolvedMobileChats.has(cleanMobile)) {
          secondaryTarget = resolvedMobileChats.get(cleanMobile)!.toString();
          console.log(`[Telegram Bot OTP]: Resolved mobile ${cleanMobile} from live updates to numeric ID ${secondaryTarget}`);
        }
      }
    }
  }

  // Attempt 1: Send to Primary Target (Must be strictly private numeric chat ID > 0)
  if (primaryTarget && !isNaN(Number(primaryTarget)) && Number(primaryTarget) > 0) {
    try {
      await requestTelegramApi('sendMessage', {
        chat_id: primaryTarget,
        text,
        parse_mode: 'HTML'
      }, token);

      const rec = findPendingOtp({ idCard, telegramTag: options.toRecipient?.telegramTag, mobileNumber: rawMobile });
      if (rec) rec.delivered = true;

      console.log(`[Telegram Bot OTP Success]: Private OTP sent to member Telegram handle ${primaryTarget}`);
      return {
        success: true,
        dispatchedTo: originalPrimary || primaryTarget,
        botLink,
        botUsername,
        otpDelivered: true,
        message: `OTP sent strictly to your private Telegram DM.`
      };
    } catch (primaryErr: any) {
      const errMsg = primaryErr.message || '';
      console.log(`[Telegram DM Notice]: Primary handle ${primaryTarget} not yet started: ${errMsg}. Trying secondary contact...`);
    }
  }

  // Attempt 2: Fallback to Secondary Target (Must be strictly private numeric chat ID > 0)
  if (secondaryTarget && !isNaN(Number(secondaryTarget)) && Number(secondaryTarget) > 0 && secondaryTarget !== primaryTarget) {
    try {
      await requestTelegramApi('sendMessage', {
        chat_id: secondaryTarget,
        text,
        parse_mode: 'HTML'
      }, token);

      const rec = findPendingOtp({ idCard, telegramTag: options.toRecipient?.telegramTag, mobileNumber: rawMobile });
      if (rec) rec.delivered = true;

      console.log(`[Telegram Bot OTP Fallback Success]: Private OTP sent to member mobile contact ${secondaryTarget}`);
      return {
        success: true,
        dispatchedTo: originalSecondary || secondaryTarget,
        botLink,
        botUsername,
        otpDelivered: true,
        message: `OTP sent strictly to your private Telegram DM.`
      };
    } catch (secErr: any) {
      const errMsg = secErr.message || '';
      console.log(`[Telegram DM Notice]: Secondary mobile contact ${secondaryTarget} not yet started: ${errMsg}`);
    }
  }

  // If BOTH primary and fallback attempts failed because bot is not yet started:
  // Prompt member to start conversation. As soon as they tap /start, the SAME OTP is sent!
  const attemptedTargets = [originalPrimary, originalSecondary].filter(Boolean).join(' / ');
  console.log(`[Telegram Private DM Require Start]: Could not DM ${attemptedTargets}. User must tap /start on ${botLink}. Pending code saved: ${options.otp}`);

  return {
    success: true,
    requireStart: true,
    botLink,
    botUsername,
    dispatchedTo: attemptedTargets,
    message: `Private Only: OTPs are sent strictly to your private Telegram DM. Please click the link and tap /start on the bot. Your OTP will be sent immediately upon starting!`
  };
}

export async function checkTelegramStart(
  telegramTag?: string,
  mobileNumber?: string,
  idCardNumber?: string,
  purpose?: string
): Promise<{
  success: boolean;
  started: boolean;
  chatId?: number;
  firstName?: string;
  otpDelivered?: boolean;
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

  const cleanTag = normalizeTag(telegramTag);
  const cleanMobile = normalizeMobile(mobileNumber);
  const cleanId = idCardNumber ? idCardNumber.toUpperCase().trim() : '';

  try {
    const updatesRes = await requestTelegramApi('getUpdates', { limit: 100 }, token);
    if (updatesRes && updatesRes.ok && Array.isArray(updatesRes.result)) {
      const updates = updatesRes.result;
      for (const update of updates) {
        if (!update.message) continue;
        const chat = update.message.chat;
        if (!chat || chat.type !== 'private' || chat.id <= 0) continue; // STRICT PRIVATE ONLY

        const fromUser = update.message.from;
        if (!fromUser) continue;

        const fromUsername = (fromUser.username || '').trim().toLowerCase();
        const fromFirstName = fromUser.first_name || '';
        const chatId = chat.id;
        const msgText = (update.message.text || '').trim();

        // Cache any seen usernames and chatIds
        if (fromUsername && chatId) {
          resolvedTelegramChats.set(fromUsername, chatId);
        }

        if (update.message.contact && update.message.contact.phone_number) {
          const contactPhone = update.message.contact.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
          if (chatId) resolvedMobileChats.set(contactPhone, chatId);
        }

        // Check 1: Deep-link payload match (e.g. /start id_A123456)
        let isIdMatch = false;
        if (cleanId && msgText.toLowerCase().includes(`id_${cleanId.toLowerCase()}`)) {
          isIdMatch = true;
        }

        // Check 2: Username match
        const isTagMatch = Boolean(cleanTag && fromUsername === cleanTag);

        // Check 3: Phone match
        let isPhoneMatch = false;
        if (update.message.contact && update.message.contact.phone_number) {
          const contactPhone = update.message.contact.phone_number.replace(/\s+/g, '').replace(/^\+/, '');
          if (cleanMobile && contactPhone.includes(cleanMobile)) {
            isPhoneMatch = true;
          }
        }

        if (isIdMatch || isTagMatch || isPhoneMatch) {
          if (fromUsername) resolvedTelegramChats.set(fromUsername, chatId);
          
          // DELIVER THE SAME ACTIVE OTP TO USER'S PRIVATE DM!
          const delivery = await deliverPendingOtpToChat({
            chatId,
            telegramTag: fromUsername || cleanTag,
            mobileNumber: cleanMobile,
            idCardNumber: cleanId,
            token
          });

          return {
            success: true,
            started: true,
            chatId,
            firstName: fromFirstName,
            otpDelivered: delivery.delivered,
            message: delivery.delivered
              ? `Verified! The OTP code was delivered to your private Telegram DM.`
              : `Successfully verified! User @${fromUser.username || fromFirstName} has started the bot.`
          };
        }
      }
    }

    // Check if user was previously resolved in cache
    let cachedChatId: number | undefined = undefined;
    if (cleanTag && resolvedTelegramChats.has(cleanTag)) {
      cachedChatId = resolvedTelegramChats.get(cleanTag);
    } else if (cleanMobile && resolvedMobileChats.has(cleanMobile)) {
      cachedChatId = resolvedMobileChats.get(cleanMobile);
    }

    if (cachedChatId && cachedChatId > 0) {
      // Deliver pending OTP if any
      const delivery = await deliverPendingOtpToChat({
        chatId: cachedChatId,
        telegramTag: cleanTag,
        mobileNumber: cleanMobile,
        idCardNumber: cleanId,
        token
      });

      return {
        success: true,
        started: true,
        chatId: cachedChatId,
        otpDelivered: delivery.delivered,
        message: delivery.delivered
          ? `Verified! The OTP code was delivered to your private Telegram DM.`
          : `Successfully verified! Bot connection is active.`
      };
    }

    return {
      success: true,
      started: false,
      message: 'Private Only: OTPs are sent strictly to your private Telegram DM. Please click the link, tap /start on the bot, then click "Verify Connection".'
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

