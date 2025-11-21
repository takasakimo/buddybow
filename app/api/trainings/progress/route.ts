import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { moduleId, completed } = body;

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    if (completed) {
      await prisma.moduleProgress.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
        update: {
          completed: true,
          completedAt: new Date(),
        },
        create: {
          userId,
          moduleId,
          completed: true,
          completedAt: new Date(),
        },
      });
    } else {
      await prisma.moduleProgress.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId,
          },
        },
        update: {
          completed: false,
          completedAt: null,
        },
        create: {
          userId,
          moduleId,
          completed: false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress update error:', error);
    return NextResponse.json(
      { error: '進捗の更新に失敗しました' },
      { status: 500 }
    );
  }
}
