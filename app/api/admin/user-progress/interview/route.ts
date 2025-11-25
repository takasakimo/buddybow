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

    // 管理者の場合は全ユーザー、一般ユーザーの場合は自分のみ
    const canViewAll = session.user.role === 'admin';
    const targetUserId = canViewAll ? userIdNum : (typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id);

    if (!canViewAll && targetUserId !== userIdNum) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const interviews = await prisma.interview.findMany({
      where: {
        userId: targetUserId,
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

