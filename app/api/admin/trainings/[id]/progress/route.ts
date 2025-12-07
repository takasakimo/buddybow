import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // ロールの後方互換性を確保
    const getUserRole = () => {
      const role = session?.user?.role || 'user';
      if (role === 'admin') return 'FULL_ADMIN';
      if (role === 'user') return 'USER';
      return role;
    };

    const userRole = getUserRole();

    // 全権管理者のみアクセス可能
    if (!session || userRole !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const trainingId = params.id;

    // 研修情報を取得
    const training = await prisma.training.findUnique({
      where: { id: trainingId },
      include: {
        modules: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        { error: '研修が見つかりません' },
        { status: 404 }
      );
    }

    // この研修のモジュールIDを取得
    const moduleIds = training.modules.map((m) => m.id);

    // この研修のモジュール進捗を持つユーザーを取得
    const moduleProgresses = await prisma.moduleProgress.findMany({
      where: {
        moduleId: {
          in: moduleIds,
        },
      },
      select: {
        userId: true,
        moduleId: true,
        completed: true,
      },
    });

    // ユーザーIDとモジュールIDを取得
    const userIds = Array.from(new Set(moduleProgresses.map((mp) => mp.userId)));
    const moduleProgressModuleIds = moduleProgresses.map((mp) => mp.moduleId);

    // ユーザー情報を取得
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // モジュール情報を取得（この研修のモジュールか確認するため）
    const modules = await prisma.module.findMany({
      where: {
        id: {
          in: moduleProgressModuleIds,
        },
      },
      select: {
        id: true,
        trainingId: true,
      },
    });

    // モジュールIDでマップ
    const moduleMap = new Map(modules.map((m) => [m.id, m]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    // ユーザーごとにグループ化して進捗率を計算
    const userProgressMap = new Map<number, {
      userId: number;
      userName: string;
      userEmail: string;
      completedModules: number;
      totalModules: number;
      progress: number;
    }>();

    moduleProgresses.forEach((mp) => {
      // この研修のモジュールか確認
      const moduleData = moduleMap.get(mp.moduleId);
      if (!moduleData || moduleData.trainingId !== trainingId) return;

      const user = userMap.get(mp.userId);
      if (!user) return;

      const userId = user.id;
      if (!userProgressMap.has(userId)) {
        userProgressMap.set(userId, {
          userId,
          userName: user.name,
          userEmail: user.email,
          completedModules: 0,
          totalModules: training.modules.length,
          progress: 0,
        });
      }

      const userProgress = userProgressMap.get(userId)!;
      if (mp.completed) {
        userProgress.completedModules++;
      }
    });

    // 進捗率を計算
    userProgressMap.forEach((progress) => {
      progress.progress = progress.totalModules > 0
        ? (progress.completedModules / progress.totalModules) * 100
        : 0;
    });

    const userProgresses = Array.from(userProgressMap.values());

    return NextResponse.json({
      training: {
        id: training.id,
        title: training.title,
        totalModules: training.modules.length,
      },
      userProgresses: userProgresses.sort((a, b) => b.progress - a.progress),
    });
  } catch (error) {
    console.error('Training progress fetch error:', error);
    return NextResponse.json(
      { error: '進捗情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

