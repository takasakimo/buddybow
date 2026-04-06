import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AXIS_LABELS, AI_TYPES, type Axis, type DiagnosisType } from '@/lib/diagnosis/ai-questions';
import { REPORT_CONTENT } from '@/lib/diagnosis/report-content';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://buddybow.vercel.app';

/**
 * GET /api/auth/line/callback?code=xxx&state=yyy
 *
 * LINEログイン認証後のコールバック。
 * 1. stateからdiagnosisIdを復元
 * 2. codeをLINE APIでアクセストークンに交換
 * 3. プロフィール取得（userId）
 * 4. DiagnosisSubmissionにlineUserId紐付け
 * 5. Messaging APIで詳細レポートをプッシュ送信（4枚カルーセル）
 * 6. thanks画面へリダイレクト
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  const siteUrl = SITE_URL;
  const redirectBase = `${siteUrl}/diagnosis/thanks`;

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
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokenRes.status}`);
    const { access_token: accessToken } = await tokenRes.json();

    // ③ プロフィール取得（LINE userId）
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) throw new Error(`Profile fetch failed: ${profileRes.status}`);
    const { userId: lineUserId } = await profileRes.json();

    // ④ DiagnosisSubmissionを更新
    const submission = await prisma.diagnosisSubmission.update({
      where: { id: diagnosisId },
      data: { lineUserId },
    });

    // ⑤ 詳細レポートをプッシュ送信
    const messagingToken = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
    if (messagingToken && submission.resultData) {
      const result = submission.resultData as {
        type: DiagnosisType;
        label: string;
        totalScore: number;
        axisScores: Record<Axis, number>;
      };

      const pushOk = await sendDetailedReport({
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

// ================================================================
// LINE Messaging API — 詳細レポート（4枚カルーセル）
// ================================================================

async function sendDetailedReport(opts: {
  lineUserId: string;
  nickname: string;
  diagnosisId: string;
  result: { type: DiagnosisType; label: string; totalScore: number; axisScores: Record<Axis, number> };
  messagingToken: string;
  siteUrl: string;
}): Promise<boolean> {
  const { lineUserId, nickname, diagnosisId, result, messagingToken, siteUrl } = opts;

  const typeInfo = AI_TYPES[result.type];
  const reportContent = REPORT_CONTENT[result.type];

  // ---- Bubble 1: 診断サマリー + 8軸スコア ----
  const axisRows = (Object.keys(AXIS_LABELS) as Axis[]).map((ax) => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'sm',
    contents: [
      { type: 'text', text: AXIS_LABELS[ax], size: 'xs', color: '#555555', flex: 4 },
      { type: 'text', text: scoreBar(result.axisScores[ax]), size: 'xs', color: '#B08968', flex: 5, margin: 'sm' },
      { type: 'text', text: `${result.axisScores[ax]}`, size: 'xs', color: '#B08968', weight: 'bold', align: 'end', flex: 2 },
    ],
  }));

  const bubble1 = {
    type: 'bubble',
    size: 'mega',
    header: header(`タイプ ${result.type}`, typeInfo.label, '1 / 4　診断サマリー'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      contents: [
        row('総合スコア', `${result.totalScore}点`),
        { type: 'separator', margin: 'md' },
        {
          type: 'text',
          text: typeInfo.desc,
          size: 'xs',
          color: '#555555',
          wrap: true,
          margin: 'md',
        },
        { type: 'separator', margin: 'md' },
        { type: 'text', text: '8軸スコア', size: 'sm', weight: 'bold', color: '#333333', margin: 'md' },
        ...axisRows,
      ],
    },
  };

  // ---- Bubble 2: 性格的な傾向 ----
  const bubble2 = {
    type: 'bubble',
    size: 'mega',
    header: header('あなたの', '性格的な傾向', '2 / 4　パーソナリティ'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      contents: [
        {
          type: 'text',
          text: reportContent.personality,
          size: 'sm',
          color: '#333333',
          wrap: true,
          lineSpacing: '6px',
        },
      ],
    },
  };

  // ---- Bubble 3: 向いている副業 ----
  const jobItems = reportContent.suitableJobs.map((job, i) => ({
    type: 'box',
    layout: 'horizontal',
    margin: 'md',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        contents: [{ type: 'text', text: `${i + 1}`, size: 'xs', color: '#ffffff', align: 'center' }],
        width: '22px',
        height: '22px',
        backgroundColor: '#B08968',
        cornerRadius: '11px',
        justifyContent: 'center',
      },
      {
        type: 'text',
        text: job,
        size: 'sm',
        color: '#333333',
        wrap: true,
        flex: 1,
        margin: 'sm',
      },
    ],
  }));

  const bubble3 = {
    type: 'bubble',
    size: 'mega',
    header: header('向いている', '副業スタイル', '3 / 4　おすすめ副業'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      contents: [
        {
          type: 'text',
          text: `${nickname}さんのタイプに合った副業を厳選しました`,
          size: 'xs',
          color: '#888888',
          wrap: true,
        },
        ...jobItems,
      ],
    },
  };

  // ---- Bubble 4: 成功への挑戦方法 + CTA ----
  const bubble4 = {
    type: 'bubble',
    size: 'mega',
    header: header('成功しやすい', '挑戦方法', '4 / 4　アクションプラン'),
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '18px',
      contents: [
        {
          type: 'text',
          text: reportContent.howToSucceed,
          size: 'sm',
          color: '#333333',
          wrap: true,
          lineSpacing: '6px',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      backgroundColor: '#FFF8F0',
      contents: [
        {
          type: 'text',
          text: '診断結果をもとに個別プランを一緒に考えます',
          size: 'xs',
          color: '#888888',
          wrap: true,
          align: 'center',
          margin: 'none',
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: '無料面談を予約する →',
            uri: `${siteUrl}/lp/meeting?diagnosisId=${diagnosisId}`,
          },
          style: 'primary',
          color: '#B08968',
          height: 'sm',
          margin: 'md',
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
  };

  const carouselMessage = {
    type: 'flex',
    altText: `📊 ${nickname}さんの詳細診断レポートが届きました（全4ページ）`,
    contents: {
      type: 'carousel',
      contents: [bubble1, bubble2, bubble3, bubble4],
    },
  };

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${messagingToken}`,
      },
      body: JSON.stringify({ to: lineUserId, messages: [carouselMessage] }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- ヘルパー ----

function header(line1: string, line2: string, badge: string) {
  return {
    type: 'box',
    layout: 'vertical',
    backgroundColor: '#B08968',
    paddingAll: '18px',
    contents: [
      { type: 'text', text: badge, size: 'xxs', color: '#f5e6d8' },
      { type: 'text', text: line1, size: 'sm', color: '#ffffff', margin: 'sm' },
      { type: 'text', text: line2, size: 'xl', color: '#ffffff', weight: 'bold', wrap: true },
    ],
  };
}

function row(label: string, value: string) {
  return {
    type: 'box',
    layout: 'horizontal',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#555555' },
      { type: 'text', text: value, size: 'sm', color: '#B08968', weight: 'bold', align: 'end' },
    ],
  };
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
