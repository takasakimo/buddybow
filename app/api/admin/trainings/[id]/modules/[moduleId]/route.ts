import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; moduleId: string } }
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

    const body = await request.json();
    const { title, description, imageUrl, videoUrl, order } = body;

    if (!title || !order) {
      return NextResponse.json(
        { error: 'タイトルと表示順序は必須です' },
        { status: 400 }
      );
    }

    const updatedModule = await prisma.module.update({
      where: {
        id: params.moduleId,
      },
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        order,
      },
    });

    return NextResponse.json(updatedModule);
  } catch (error) {
    console.error('Module update error:', error);
    return NextResponse.json(
      { error: 'チャプターの更新に失敗しました' },
      { status: 500 }
    );
  }
}
