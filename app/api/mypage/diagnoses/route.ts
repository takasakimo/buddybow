import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // 診断結果を取得
    const diagnoses = await prisma.diagnosis.findMany({
      where: { userId },
      select: {
        id: true,
        personalityType: true,
        pdfUrl: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(diagnoses);
  } catch (error) {
    console.error('Diagnoses fetch error:', error);
    return NextResponse.json(
      { error: '診断結果の取得に失敗しました' },
      { status: 500 }
    );
  }
}

