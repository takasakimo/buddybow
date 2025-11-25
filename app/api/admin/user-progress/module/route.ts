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
    const { userId, moduleId, completed } = body;

    if (!userId || !moduleId) {
      return NextResponse.json(
        { error: 'userIdとmoduleIdが必要です' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // モジュールが存在するか確認
    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!moduleData) {
      return NextResponse.json(
        { error: 'モジュールが見つかりません' },
        { status: 404 }
      );
    }

    // 進捗情報を追加または更新
    const progress = await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId: userIdNum,
          moduleId,
        },
      },
      update: {
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: userIdNum,
        moduleId,
        completed: completed ?? true,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Module progress add error:', error);
    return NextResponse.json(
      { error: '進捗の追加に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, moduleId, completed } = body;

    if (!userId || !moduleId || completed === undefined) {
      return NextResponse.json(
        { error: 'userId、moduleId、completedが必要です' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // 進捗情報を更新
    const progress = await prisma.moduleProgress.upsert({
      where: {
        userId_moduleId: {
          userId: userIdNum,
          moduleId,
        },
      },
      update: {
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId: userIdNum,
        moduleId,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Module progress update error:', error);
    return NextResponse.json(
      { error: '進捗の更新に失敗しました' },
      { status: 500 }
    );
  }
}

