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

    // 全権管理者または担当者のみアクセス可能
    if (!session || (userRole !== 'FULL_ADMIN' && userRole !== 'MANAGER')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = parseInt(params.id);
    const currentAdminId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    // ユーザー情報と進捗情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProgress: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 担当者の場合、担当ユーザーでない場合はアクセス拒否
    if (userRole === 'MANAGER' && user.assignedAdminId !== currentAdminId) {
      return NextResponse.json(
        { error: 'このユーザーへのアクセス権限がありません' },
        { status: 403 }
      );
    }

    // 全研修を取得
    const trainings = await prisma.training.findMany({
      include: {
        modules: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // ユーザーのモジュール進捗を取得
    const moduleProgresses = await prisma.moduleProgress.findMany({
      where: {
        userId,
      },
    });

    // モジュールIDを取得してモジュール情報を取得
    const moduleIds = moduleProgresses.map((mp) => mp.moduleId);
    const modulesData = await prisma.module.findMany({
      where: {
        id: {
          in: moduleIds,
        },
      },
      include: {
        training: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // モジュールをIDでマップ
    const moduleMap = new Map(modulesData.map((m) => [m.id, m]));

    // モジュール進捗を整形
    const moduleProgressesFormatted = moduleProgresses
      .map((mp) => {
        const moduleData = moduleMap.get(mp.moduleId);
        if (!moduleData) return null;
        return {
          moduleId: mp.moduleId,
          moduleTitle: moduleData.title,
          trainingTitle: moduleData.training.title,
          completed: mp.completed,
          completedAt: mp.completedAt,
          deadline: mp.deadline,
        };
      })
      .filter((mp): mp is NonNullable<typeof mp> => mp !== null);

    // その他のマイページ情報を取得
    const [roadmaps, interviews, diagnoses, dailyReports, consultations, achievements] = await Promise.all([
      prisma.roadmap.findMany({
        where: { userId },
        include: {
          milestones: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.interview.findMany({
        where: { userId },
        orderBy: { interviewDate: 'desc' },
        take: 20,
      }),
      prisma.diagnosis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => []), // エラーが発生した場合は空配列を返す
      prisma.dailyReport.findMany({
        where: { userId },
        select: { id: true, date: true, type: true },
        orderBy: { date: 'desc' },
        take: 10,
      }),
      prisma.consultation.findMany({
        where: { userId },
        select: { 
          id: true, 
          title: true, 
          content: true,
          status: true,
          answer: true,
          answeredAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.achievement.findMany({
        where: { userId },
        select: { id: true, title: true, badgeType: true },
        orderBy: { earnedAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      userProgress: user.userProgress,
      trainings: trainings.map((t) => ({
        id: t.id,
        title: t.title,
        modules: t.modules.map((m) => ({
          id: m.id,
          title: m.title,
        })),
      })),
      moduleProgresses: moduleProgressesFormatted,
      roadmaps: roadmaps.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        targetMonths: r.targetMonths,
        startDate: r.startDate,
        endDate: r.endDate,
        milestones: r.milestones,
        createdAt: r.createdAt,
      })),
      interviews: interviews.map((i) => ({
        id: i.id,
        interviewDate: i.interviewDate,
        content: i.content,
        pdfUrl: i.pdfUrl,
        createdAt: i.createdAt,
      })),
      diagnoses: diagnoses.map((d) => {
        const diagnosis = d as {
          id: string;
          personalityType: string | null;
          pdfUrl?: string | null;
          comment?: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
        return {
          id: diagnosis.id,
          personalityType: diagnosis.personalityType || null,
          pdfUrl: diagnosis.pdfUrl || null,
          comment: diagnosis.comment || null,
          createdAt: diagnosis.createdAt,
          updatedAt: diagnosis.updatedAt,
        };
      }),
      dailyReports,
      consultations: consultations.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        status: c.status,
        answer: c.answer,
        answeredAt: c.answeredAt,
        createdAt: c.createdAt,
      })),
      achievements,
    });
  } catch (error) {
    console.error('User progress detail fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

