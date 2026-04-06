import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AXIS_LABELS, AI_TYPES, type Axis, type DiagnosisType } from '@/lib/diagnosis/ai-questions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://buddybow.vercel.app';

/**
 * GET /api/auth/line/callback?code=xxx&state=yyy
 *
 * LINEログイン認証後のコールバック。
 * 1. stateからdiagnosisIdを復元
 * 2. codeをLINE APIでアクセストークンに交換
 * 3. プロフィール取得（userId）
 * 4. DiagnosisSubmissionにlineUserId紐付け
 * 5. Messaging APIで詳細レポートをプッシュ送信
 * 6. thanks画面へリダイレクト
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const siteUrl = SITE_URL;
  const redirectBase = `${siteUrl}/diagnosis/thanks`;

  // LINEログインキャンセル
  if (errorParam) {
    return NextResponse.redirect(`${redirectBase}?status=cancelled`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${redirectBase}?status=error&reason=missing_params`);
  }

  try {
    // ① stateからdiagnosisIdを取得
    const oauthState = await prisma.lineOAuthState.findUnique({ where: { state } });
    if (!oauthState || oauthState.expiresAt < new Date()) {
      await prisma.lineOAuthState.deleteMany({ where: { state } });
      return NextResponse.redirect(`${redirectBase}?status=error&reason=state_expired`);
    }
    const { diagnosisId } = oauthState;

    // stateは使い捨て
    await prisma.lineOAuthState.delete({ where: { state } });

    // ② codeをアクセストークンに交換
    const callbackUrl = `${siteUrl}/api/auth/line/callback`;
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: callbackUrl,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
      }),
    });
    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${tokenRes.status}`);
    }
    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    // ③ プロフィール取得（LINE userId）
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new Error(`Profile fetch failed: ${profileRes.status}`);
    }
    const profile = await profileRes.json();
    const lineUserId: string = profile.userId;

    // ④ DiagnosisSubmissionを更新
    const submission = await prisma.diagnosisSubmission.update({
      where: { id: diagnosisId },
      data: { lineUserId },
    });

    // ⑤ Messaging APIでレポートをプッシュ送信
    const messagingToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
    if (messagingToken && submission.resultData) {
      const result = submission.resultData as {
        type: DiagnosisType;
        label: string;
        totalScore: number;
        axisScores: Record<Axis, number>;
      };

      const pushOk = await sendLineReport({
        lineUserId,
        nickname: submission.nickname,
        diagnosisId,
        result,
        messagingToken,
        siteUrl,
      });

      if (pushOk) {
        await prisma.diagnosisSubmission.update({
          where: { id: diagnosisId },
          data: { lineReportSentAt: new Date() },
        });
      }
    }

    return NextResponse.redirect(`${redirectBase}?status=success&diagnosisId=${diagnosisId}`);
  } catch (err) {
    console.error('LINE callback error:', err);
    return NextResponse.redirect(`${redirectBase}?status=error&reason=server_error`);
  }
}

// ---- LINE Messaging API ----

async function sendLineReport(opts: {
  lineUserId: string;
  nickname: string;
  diagnosisId: string;
  result: { type: DiagnosisType; label: string; totalScore: number; axisScores: Record<Axis, number> };
  messagingToken: string;
  siteUrl: string;
}): Promise<boolean> {
  const { lineUserId, nickname, diagnosisId, result, messagingToken, siteUrl } = opts;

  const typeInfo = AI_TYPES[result.type];
  const axisRows = (Object.keys(AXIS_LABELS) as Axis[]).map((ax) => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: AXIS_LABELS[ax], size: 'xs', color: '#555555', flex: 4 },
      {
        type: 'text',
        text: `${result.axisScores[ax]}`,
        size: 'xs',
        color: '#B08968',
        weight: 'bold',
        align: 'end',
        flex: 1,
      },
      {
        type: 'text',
        text: scoreBar(result.axisScores[ax]),
        size: 'xs',
        color: '#B08968',
        flex: 5,
        margin: 'sm',
      },
    ],
    margin: 'sm',
  }));

  const flexMessage = {
    type: 'flex',
    altText: `📊 ${nickname}さんのAI活用スタイル診断レポートが届きました`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#B08968',
        paddingAll: '20px',
        contents: [
          {
            type: 'text',
            text: 'AI活用スタイル診断レポート',
            size: 'xs',
            color: '#ffffff',
            weight: 'bold',
          },
          {
            type: 'text',
            text: `タイプ ${result.type}：${typeInfo.label}`,
            size: 'lg',
            color: '#ffffff',
            weight: 'bold',
            wrap: true,
            margin: 'sm',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '20px',
        contents: [
          // 総合スコア
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '総合スコア', size: 'sm', color: '#555555' },
              {
                type: 'text',
                text: `${result.totalScore}点`,
                size: 'sm',
                color: '#B08968',
                weight: 'bold',
                align: 'end',
              },
            ],
          },
          { type: 'separator', margin: 'md' },
          // タイプ説明
          {
            type: 'text',
            text: typeInfo.desc,
            size: 'xs',
            color: '#555555',
            wrap: true,
            margin: 'md',
          },
          { type: 'separator', margin: 'md' },
          // 8軸スコア
          { type: 'text', text: '8軸スコア', size: 'sm', weight: 'bold', color: '#333333', margin: 'md' },
          ...axisRows,
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        paddingAll: '16px',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '無料面談を予約する',
              uri: `${siteUrl}/lp/meeting?diagnosisId=${diagnosisId}`,
            },
            style: 'primary',
            color: '#B08968',
            height: 'sm',
          },
          {
            type: 'text',
            text: '強引な勧誘は一切行いません',
            size: 'xxs',
            color: '#aaaaaa',
            align: 'center',
            margin: 'sm',
          },
        ],
      },
    },
  };

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${messagingToken}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [flexMessage],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** スコアを簡易バー表示に変換（例: 75 → "████████░░"） */
function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
