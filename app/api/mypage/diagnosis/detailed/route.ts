import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// AI活用診断結果をマイページに保存
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);

    const body = await request.json();
    const { personalityType, label, totalScore, axisScores } = body;

    if (!personalityType || typeof personalityType !== 'string') {
      return NextResponse.json({ error: '診断結果が不正です' }, { status: 400 });
    }

    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId,
        personalityType: personalityType.trim(),
        comment: typeof label === 'string' ? label : undefined,
        skillMap: { totalScore, axisScores },
      },
    });

    return NextResponse.json({
      success: true,
      id: diagnosis.id,
      message: '診断結果をマイページに保存しました',
    });
  } catch (error) {
    console.error('AI diagnosis save error:', error);
    return NextResponse.json({ error: '診断結果の保存に失敗しました' }, { status: 500 });
  }
}
