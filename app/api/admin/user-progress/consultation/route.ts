import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
    const { userId, title, content, answer, status } = body;

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: 'userId、title、contentが必要です' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // 相談履歴を作成
    const consultation = await prisma.consultation.create({
      data: {
        userId: userIdNum,
        title: title.trim(),
        content: content.trim(),
        answer: answer?.trim() || null,
        status: status || (answer?.trim() ? 'answered' : 'pending'),
        answeredAt: answer?.trim() ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, consultation });
  } catch (error) {
    console.error('Consultation creation error:', error);
    return NextResponse.json(
      { error: '相談履歴の追加に失敗しました' },
      { status: 500 }
    );
  }
}

