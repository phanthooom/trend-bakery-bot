import { verifyInitData } from './_auth';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Telegram-Init-Data, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const initData = (req.headers['x-telegram-init-data'] as string) || '';
  const botToken = process.env.BOT_TOKEN || '';

  const user = verifyInitData(initData, botToken);

  return res.status(200).json({
    verified: !!user,
    telegram_id: user?.id ?? null,
    username: user?.username ?? null,
    initData_length: initData.length,
    bot_token_set: !!botToken,
    admin_id_env: process.env.ADMIN_TELEGRAM_ID ?? null,
  });
}
