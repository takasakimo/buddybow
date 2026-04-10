import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DIMENSION_LABELS, DIMENSION_ORDER, type DimensionId } from '@/lib/diagnosis/p256';

export const dynamic = 'force-dynamic';

interface GeneratedSubItem {
  title: string;
  description?: string | null;
  children?: GeneratedSubItem[];
}

interface GeneratedMilestone {
  month: number;
  title: string;
  description?: string | null;
  subItems?: GeneratedSubItem[];
}

/**
 * POST /api/mypage/roadmap/generate
 *
 * 診断結果をコンテキストとして、ユーザー自身のロードマップをAI生成＋保存する。
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI生成機能が設定されていません。管理者にお問い合わせください。' },
        { status: 503 }
      );
    }

    const userId = parseInt(session.user.id as string);
    const body = await request.json();
    const {
      goal,
      firstStep,
      targetMonths,
      // 診断コンテキスト（任意、あればプロンプトに含める）
      diagnosisKey,   // "HHLHHLHL"
      archetype,      // "発信クリエイター"
      dimensionScores, // Record<DimensionId, { rawScore: number; level: 'H'|'L' }>
    } = body;

    const months = Math.min(6, Math.max(1, parseInt(targetMonths) || 3));

    if (!goal?.trim()) {
      return NextResponse.json({ error: 'ゴールを入力してください' }, { status: 400 });
    }

    // ── 診断コンテキストの構築 ──────────────────────────────
    let diagnosisContext = '';
    if (diagnosisKey && typeof diagnosisKey === 'string' && diagnosisKey.length === 8) {
      const dims = DIMENSION_ORDER.map((dim: DimensionId, i: number) => {
        const level = diagnosisKey[i] as 'H' | 'L';
        const label = DIMENSION_LABELS[dim];
        const levelLabel = level === 'H' ? label.Hlabel : label.Llabel;
        const score = (dimensionScores as Record<DimensionId, { rawScore: number }>)?.[dim]?.rawScore;
        return `  - ${label.ja}：${levelLabel}${score != null ? `（${score}/20）` : ''}`;
      }).join('\n');

      diagnosisContext = `
【受講者の診断結果（256パターン副業適性診断）】
パーソナリティタイプ：${diagnosisKey}${archetype ? `（${archetype}）` : ''}
8次元プロフィール：
${dims}

このパーソナリティタイプを踏まえ、その人の強みを活かし、弱点をカバーできるロードマップを作成してください。
`;
    }

    // ── OpenAI API呼び出し（fetchベース）─────────────────
    const prompt = `あなたは副業コーチです。以下の情報に基づき、${months}ヶ月で目標を達成するための具体的なロードマップ（マインドマップ形式）を作成してください。
${diagnosisContext}
【目標（${months}ヶ月後のゴール）】
${goal.trim()}

【最初の一歩】${firstStep?.trim() ? `\n${firstStep.trim()}` : '\n（目標から逆算して、今日から取り組める最初の行動を提案してください）'}

【出力形式】
以下のJSON形式のみを出力してください。余計な説明は一切不要です。

{
  "milestones": [
    {
      "month": 1,
      "title": "その月で達成すべき具体的な目標",
      "description": "説明（任意、なければnull）",
      "subItems": [
        {
          "title": "具体的なアクション",
          "description": null,
          "children": []
        },
        {
          "title": "親タスク（子を持つ場合）",
          "description": null,
          "children": [
            { "title": "子タスク", "description": null, "children": [] }
          ]
        }
      ]
    }
  ]
}

【ルール】
- milestones は month 1 から ${months} まで、各月1つ
- 1ヶ月目：「最初の一歩」を必ず含め、その月のToDoを具体化する
- 最終月：「目標」の達成を目指す内容にする
- subItems は各月5〜12個程度、実行可能な粒度で（最大3階層）
- 必ず有効なJSONのみ出力すること`;

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
        temperature: 0.7,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => '');
      console.error('OpenAI API error:', errText);
      return NextResponse.json({ error: 'AIの呼び出しに失敗しました' }, { status: 500 });
    }

    const aiJson = await aiRes.json() as { choices?: { message?: { content?: string } }[] };
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'AIの応答を取得できませんでした' }, { status: 500 });
    }

    let parsed: { milestones?: GeneratedMilestone[] };
    try {
      parsed = JSON.parse(content) as { milestones?: GeneratedMilestone[] };
    } catch {
      return NextResponse.json({ error: 'AIの応答の解析に失敗しました' }, { status: 500 });
    }

    const milestones = Array.isArray(parsed.milestones) ? parsed.milestones : [];
    if (milestones.length === 0) {
      return NextResponse.json({ error: 'マイルストーンが生成されませんでした' }, { status: 500 });
    }

    // ── DBへ保存 ─────────────────────────────────────────
    const start = new Date();
    start.setDate(1);
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);

    const title = archetype
      ? `${archetype}タイプのロードマップ — ${goal.trim().slice(0, 30)}${goal.trim().length > 30 ? '…' : ''}`
      : `ロードマップ — ${goal.trim().slice(0, 40)}${goal.trim().length > 40 ? '…' : ''}`;

    type SubItemInput = { title: string; description?: string | null; children?: SubItemInput[] };

    const mapRootSubItems = (subItems: SubItemInput[]) =>
      subItems.map((s, i) => ({
        title: s.title,
        description: s.description?.trim() || null,
        order: i,
        completed: false,
      }));

    const created = await prisma.roadmap.create({
      data: {
        userId,
        title,
        description: `診断タイプ: ${diagnosisKey ?? '未診断'} | 目標: ${goal.trim()}`,
        targetMonths: months,
        startDate: start,
        endDate: end,
        milestones: {
          create: milestones.map((m, i) => {
            const targetDate = new Date(start);
            targetDate.setMonth(targetDate.getMonth() + (m.month - 1));
            const base: {
              month: number; title: string; description: string | null;
              targetDate: Date; order: number; completed: boolean;
              subItems?: { create: { title: string; description: string | null; order: number; completed: boolean }[] };
            } = {
              month: m.month ?? i + 1,
              title: m.title,
              description: m.description?.trim() || null,
              targetDate,
              order: i + 1,
              completed: false,
            };
            const subs = m.subItems as SubItemInput[] | undefined;
            if (Array.isArray(subs) && subs.length > 0) {
              base.subItems = { create: mapRootSubItems(subs) };
            }
            return base;
          }),
        },
      },
      include: {
        milestones: {
          orderBy: { order: 'asc' },
          include: { subItems: { orderBy: { order: 'asc' }, where: { parentId: null } } },
        },
      },
    });

    // 子サブアイテムを追加（2階層目以降）
    const allChildren: {
      milestoneId: string; parentId: string;
      title: string; description: string | null; order: number;
    }[] = [];

    for (let mi = 0; mi < milestones.length; mi++) {
      const mInput = milestones[mi];
      const mCreated = created.milestones[mi];
      if (!mCreated) continue;
      const subs = (mInput.subItems ?? []) as SubItemInput[];
      const rootCreated = mCreated.subItems;
      for (let si = 0; si < subs.length; si++) {
        const children = subs[si].children ?? [];
        const parent = rootCreated[si];
        if (!parent || children.length === 0) continue;
        children.forEach((c, ci) => {
          allChildren.push({
            milestoneId: mCreated.id,
            parentId: parent.id,
            title: c.title,
            description: c.description?.trim() || null,
            order: ci,
          });
        });
      }
    }

    if (allChildren.length > 0) {
      await prisma.milestoneSubItem.createMany({
        data: allChildren.map((d) => ({ ...d, completed: false })),
      });
    }

    return NextResponse.json({ success: true, roadmapId: created.id });
  } catch (error) {
    console.error('User roadmap generate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'ロードマップの生成に失敗しました' },
      { status: 500 }
    );
  }
}
