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

    // 全権管理者のみアクセス可能
    if (!session || userRole !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const studySessions = await prisma.studySession.findMany({
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(studySessions);
  } catch (error) {
    console.error('Study sessions fetch error:', error);
    return NextResponse.json(
      { error: '勉強会の取得に失敗しました' },
      { status: 500 }
    );
  }
}

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

    // 全権管理者のみアクセス可能
    if (!session || userRole !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startTime, endTime, zoomId } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: '必須項目が入力されていません' },
        { status: 400 }
      );
    }

    const studySession = await prisma.studySession.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        zoomId,
        status: 'upcoming',
      },
    });

    return NextResponse.json(studySession, { status: 201 });
  } catch (error) {
    console.error('Study session creation error:', error);
    return NextResponse.json(
      { error: '勉強会の作成に失敗しました' },
      { status: 500 }
    );
  }
}
