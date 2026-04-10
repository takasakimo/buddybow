import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const userId = parseInt(session.user.id as string);

    const roadmaps = await prisma.roadmap.findMany({
      where: { userId },
      include: {
        milestones: {
          orderBy: [{ month: 'asc' }, { order: 'asc' }],
          include: {
            traineeEntry: true,
            subItems: {
              orderBy: { order: 'asc' },
              include: { traineeEntry: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(roadmaps);
  } catch (error) {
    console.error('Mypage roadmaps fetch error:', error);
    return NextResponse.json(
      { error: 'ロードマップの取得に失敗しました' },
      { status: 500 }
    );
  }
}
