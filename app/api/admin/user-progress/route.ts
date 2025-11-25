import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        role: 'user', // ユーザーのみ
      },
      include: {
        userProgress: true,
        _count: {
          select: {
            roadmaps: true,
            dailyReports: true,
            consultations: true,
            achievements: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('User progress fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

