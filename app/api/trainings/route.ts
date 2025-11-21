import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const trainings = await prisma.training.findMany({
      include: {
        modules: true,
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(trainings);
  } catch (error) {
    console.error('Trainings fetch error:', error);
    return NextResponse.json(
      { error: '研修の取得に失敗しました' },
      { status: 500 }
    );
  }
}
