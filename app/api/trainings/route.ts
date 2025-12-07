import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    // ユーザーの進捗情報を取得
    const userProgress = await prisma.moduleProgress.findMany({
      where: {
        userId,
      },
    });

    // 進捗情報をモジュールIDでマップ
    const progressMap = new Map(
      userProgress.map((p) => [p.moduleId, p])
    );

    const trainings = await prisma.training.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        modules: {
          orderBy: {
            order: 'asc',
          },
        },
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 進捗情報を計算して追加
    const trainingsWithProgress = trainings.map((training) => {
      const completedModules = training.modules.filter((module) => {
        const progress = progressMap.get(module.id);
        return progress?.completed;
      }).length;

      const totalModules = training.modules.length;
      const progressPercent = totalModules > 0 
        ? Math.round((completedModules / totalModules) * 100)
        : 0;

      const firstProgress = training.modules
        .map((m) => progressMap.get(m.id))
        .filter((p) => p)
        .sort((a, b) => a!.createdAt.getTime() - b!.createdAt.getTime())[0];

      const allCompleted = training.modules.every((module) => {
        const progress = progressMap.get(module.id);
        return progress?.completed;
      });

      const lastCompletedProgress = training.modules
        .map((m) => progressMap.get(m.id))
        .filter((p) => p?.completed && p.completedAt)
        .sort((a, b) => b!.completedAt!.getTime() - a!.completedAt!.getTime())[0];

      return {
        ...training,
        progress: totalModules > 0 && firstProgress ? {
          progressPercent,
          startedAt: firstProgress.createdAt,
          completedAt: allCompleted && lastCompletedProgress?.completedAt ? lastCompletedProgress.completedAt : null,
        } : null,
      };
    });

    return NextResponse.json(trainingsWithProgress);
  } catch (error) {
    console.error('Trainings fetch error:', error);
    return NextResponse.json(
      { error: '研修の取得に失敗しました' },
      { status: 500 }
    );
  }
}
