import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// CORS用ヘッダー（LINE LIFFや外部サイトからもPOSTできるように）
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * 診断結果を受け取るAPI
 * - Web診断ページ（/diagnosis）からの送信
 * - LINE LIFF・外部診断アプリからの送信
 * 認証: 環境変数 DIAGNOSIS_SUBMIT_API_KEY が設定されていればヘッダーで検証
 */
export async function POST(request: Request) {
  try {
    // オプション: APIキーで外部アプリのみ許可（設定されている場合）
    const apiKey = process.env.DIAGNOSIS_SUBMIT_API_KEY;
    if (apiKey) {
      const authHeader = request.headers.get('x-api-key') || request.headers.get('authorization');
      const providedKey = authHeader?.replace('Bearer ', '');
      if (providedKey !== apiKey) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401, headers: corsHeaders });
      }
    }

    const body = await request.json();
    const { nickname, personalityType, diagnosedAt, resultData, source } = body;

    if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
      return NextResponse.json(
        { error: 'nicknameは必須です' },
        { status: 400, headers: corsHeaders }
      );
    }

    const diagnosedAtDate = diagnosedAt
      ? new Date(diagnosedAt)
      : new Date();

    const submission = await prisma.diagnosisSubmission.create({
      data: {
        nickname: nickname.trim(),
        personalityType: personalityType?.trim() || null,
        resultData: resultData ?? null,
        diagnosedAt: diagnosedAtDate,
        source: source || 'lp',
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: submission.id,
        message: '診断結果を受け付けました',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Diagnosis submit error:', error);
    return NextResponse.json(
      { error: '診断結果の保存に失敗しました' },
      { status: 500, headers: corsHeaders }
    );
  }
}
