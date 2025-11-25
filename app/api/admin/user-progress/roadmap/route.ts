import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, title, description, targetMonths, startDate, endDate, milestones } = body;

    if (!userId || !title || !targetMonths || !startDate || !endDate) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // ロードマップを作成
    const roadmap = await prisma.roadmap.create({
      data: {
        userId: userIdNum,
        title,
        description: description || null,
        targetMonths: parseInt(targetMonths),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        milestones: milestones && Array.isArray(milestones) && milestones.length > 0
          ? {
              create: milestones.map((milestone: { title: string; description?: string; targetDate: string; order?: number }, index: number) => ({
                title: milestone.title,
                description: milestone.description || null,
                targetDate: new Date(milestone.targetDate),
                order: milestone.order || index + 1,
                completed: false,
              })),
            }
          : undefined,
      },
      include: {
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ success: true, roadmap });
  } catch (error) {
    console.error('Roadmap creation error:', error);
    return NextResponse.json(
      { error: 'ロードマップの作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userIdが必要です' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    const roadmaps = await prisma.roadmap.findMany({
      where: {
        userId: userIdNum,
      },
      include: {
        milestones: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(roadmaps);
  } catch (error) {
    console.error('Roadmap fetch error:', error);
    return NextResponse.json(
      { error: 'ロードマップの取得に失敗しました' },
      { status: 500 }
    );
  }
}

