import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // 全権管理者または担当者のみアクセス可能
    if (!session || (session.user.role !== 'FULL_ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const currentUserId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id;

    // 全権管理者は全ユーザーを取得、担当者は担当ユーザーのみ
    const whereClause = session.user.role === 'FULL_ADMIN' 
      ? {} 
      : {
          OR: [
            { assignedAdminId: currentUserId },
            { id: currentUserId }, // 自分自身も表示
          ],
        };

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        assignedAdminId: true,
        assignedAdmin: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    );
  }
}
