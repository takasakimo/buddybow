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

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Consultations fetch error:', error);
    return NextResponse.json(
      { error: '相談履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

