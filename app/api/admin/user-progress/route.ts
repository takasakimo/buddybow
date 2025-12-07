import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
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

    const currentAdminId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    // 全権管理者は全ユーザーを取得（管理者含む）、担当者は担当ユーザーのみ
    const whereClause = userRole === 'FULL_ADMIN'
      ? {} // 全ユーザー（管理者含む）を取得
      : {
          role: 'USER',
          assignedAdminId: currentAdminId, // ログイン中の担当者の担当ユーザーのみ
        };

    const users = await prisma.user.findMany({
      where: whereClause,
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

