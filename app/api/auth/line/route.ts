import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

/**
 * GET /api/auth/line?diagnosisId=xxx
 *
 * 診断IDをstateに埋め込んでLINEログインOAuthを開始。
 * bot_prompt=normal により、ログイン後にLINE公式アカウントの友達追加も促す。
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const diagnosisId = searchParams.get('diagnosisId');

  if (!diagnosisId) {
    return NextResponse.json({ error: 'diagnosisId is required' }, { status: 400 });
  }

  const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buddybow.vercel.app';

  if (!channelId) {
    return NextResponse.json({ error: 'LINE Login not configured' }, { status: 500 });
  }

  // ランダムstateを生成（CSRF対策兼diagnosisId紐付けキー）
  const state = randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10分

  await prisma.lineOAuthState.create({
    data: { state, diagnosisId, expiresAt },
  });

  const callbackUrl = `${siteUrl}/api/auth/line/callback`;
  const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize');
  lineAuthUrl.searchParams.set('response_type', 'code');
  lineAuthUrl.searchParams.set('client_id', channelId);
  lineAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  lineAuthUrl.searchParams.set('state', state);
  lineAuthUrl.searchParams.set('scope', 'profile');
  // ログイン後にLINE公式アカウントの友達追加も促す
  lineAuthUrl.searchParams.set('bot_prompt', 'normal');

  return NextResponse.redirect(lineAuthUrl.toString());
}
