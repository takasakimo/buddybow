import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function getUserRole(session: Session | null) {
  const role = session?.user?.role || 'user';
  if (role === 'admin') return 'FULL_ADMIN';
  if (role === 'user') return 'USER';
  return role;
}

export type StaffCoachingInsight = {
  developmentApproach: string;
  keyMessages: string;
  precautions: string;
  generatedAt: string;
};

/**
 * POST — 診断内容をもとにスタッフ向けアドバイスをAI生成して保存（管理者・担当メンターのみ）
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const userRole = getUserRole(session);
    if (userRole !== 'FULL_ADMIN' && userRole !== 'MANAGER') {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const rawId = session.user?.id;
    if (rawId === undefined || rawId === null) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }
    const currentAdminId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

    const diagnosisId = params.id;
    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id: diagnosisId },
      include: { user: { select: { id: true, name: true, assignedAdminId: true } } },
    });

    if (!diagnosis) {
      return NextResponse.json({ error: '診断が見つかりません' }, { status: 404 });
    }

    if (userRole === 'MANAGER' && diagnosis.user.assignedAdminId !== currentAdminId) {
      return NextResponse.json({ error: 'このユーザーへのアクセス権限がありません' }, { status: 403 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY が未設定のためAI生成できません' },
        { status: 503 }
      );
    }

    const stringifyJson = (v: unknown) => {
      if (v == null) return '';
      if (typeof v === 'string') return v;
      try {
        return JSON.stringify(v, null, 2);
      } catch {
        return String(v);
      }
    };

    const context = `
【受講者名】${diagnosis.user.name}
【行動タイプ・パーソナリティ表示】${diagnosis.personalityType ?? '（未入力）'}
【コメント・診断サマリー】
${diagnosis.comment ?? '（なし）'}
【強み（JSON）】
${stringifyJson(diagnosis.strengths)}
【弱み・課題（JSON）】
${stringifyJson(diagnosis.weaknesses)}
【推奨事項（JSON）】
${stringifyJson(diagnosis.recommendations)}
【スキルマップ（JSON）】
${stringifyJson(diagnosis.skillMap)}
`.trim();

    const prompt = `あなたは副業・リスキリング領域の熟練メンター向けコーチです。以下の「受講者の診断結果」を読み、メンター・管理者が本人の伴走に使うための実践的なメモを日本語で書いてください。

${context}

【出力】
次のJSONオブジェクトのみを出力してください（前後に説明文を付けないこと）。
{
  "developmentApproach": "この人の伸ばし方・育成の方向性（具体例・段階を含む。複数段落可）",
  "keyMessages": "本人に伝えるとよいこと・声かけのポイント（箇条書き混在可）",
  "precautions": "注意事項・地雷になりやすい点・オーバーケアしすぎ注意など"
}

各フィールドは空にせず、診断情報が薄い場合は一般的な伴走観点から推論して補ってください。`;

    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('OpenAI staff-insight error:', errText);
      return NextResponse.json({ error: 'AIの呼び出しに失敗しました' }, { status: 502 });
    }

    const aiJson = (await aiRes.json()) as { choices?: { message?: { content?: string } }[] };
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AIの応答が空でした' }, { status: 502 });
    }

    let parsed: { developmentApproach?: string; keyMessages?: string; precautions?: string };
    try {
      parsed = JSON.parse(content) as typeof parsed;
    } catch {
      return NextResponse.json({ error: 'AIの応答の解析に失敗しました' }, { status: 502 });
    }

    const insight: StaffCoachingInsight = {
      developmentApproach: (parsed.developmentApproach ?? '').trim() || '（生成されませんでした）',
      keyMessages: (parsed.keyMessages ?? '').trim() || '（生成されませんでした）',
      precautions: (parsed.precautions ?? '').trim() || '（生成されませんでした）',
      generatedAt: new Date().toISOString(),
    };

    await prisma.diagnosis.update({
      where: { id: diagnosisId },
      data: { adminStaffCoachingInsight: insight as object },
    });

    return NextResponse.json({ success: true, insight });
  } catch (error) {
    console.error('Staff insight generation error:', error);
    return NextResponse.json({ error: '生成に失敗しました' }, { status: 500 });
  }
}
