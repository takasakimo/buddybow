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
    const { userId, pdfUrl, comment } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userIdが必要です' },
        { status: 400 }
      );
    }

    if (!pdfUrl && !comment) {
      return NextResponse.json(
        { error: 'PDFファイルまたはコメントのいずれかは必須です' },
        { status: 400 }
      );
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

    // 診断結果を作成
    const diagnosis = await prisma.diagnosis.create({
      data: {
        userId: userIdNum,
        pdfUrl: pdfUrl || null,
        comment: comment || null,
      },
    });

    return NextResponse.json({ success: true, diagnosis });
  } catch (error) {
    console.error('Diagnosis creation error:', error);
    return NextResponse.json(
      { error: '診断結果の追加に失敗しました' },
      { status: 500 }
    );
  }
}

