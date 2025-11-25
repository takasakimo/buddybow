import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { userId, interviewDate, content, pdfUrl } = body;

    if (!userId || !interviewDate) {
      return NextResponse.json(
        { error: 'userIdと面談日は必須です' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // 面談を作成
    const interview = await prisma.interview.create({
      data: {
        userId: userIdNum,
        interviewDate: new Date(interviewDate),
        content: content || null,
        pdfUrl: pdfUrl || null,
      },
    });

    return NextResponse.json({ success: true, interview });
  } catch (error) {
    console.error('Interview creation error:', error);
    return NextResponse.json(
      { error: '面談の作成に失敗しました' },
      { status: 500 }
    );
  }
}

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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userIdが必要です' },
        { status: 400 }
      );
    }

    const userIdNum = parseInt(userId);

    // ロールの後方互換性を確保
    const getUserRole = () => {
      const role = session?.user?.role || 'user';
      if (role === 'admin') return 'FULL_ADMIN';
      if (role === 'user') return 'USER';
      return role;
    };

    const userRole = getUserRole();

    // 全権管理者の場合は全ユーザー、担当者の場合は担当ユーザーのみ
    const canViewAll = userRole === 'FULL_ADMIN';
    const currentAdminId = typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    
    if (!canViewAll) {
      // 担当者の場合、担当ユーザーか確認
      const user = await prisma.user.findUnique({
        where: { id: userIdNum },
        select: { assignedAdminId: true },
      });
      
      if (!user || user.assignedAdminId !== currentAdminId) {
        return NextResponse.json(
          { error: '権限がありません' },
          { status: 403 }
        );
      }
    }

    const interviews = await prisma.interview.findMany({
      where: {
        userId: userIdNum,
      },
      orderBy: {
        interviewDate: 'desc',
      },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Interview fetch error:', error);
    return NextResponse.json(
      { error: '面談情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

