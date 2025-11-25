import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
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

    const body = await request.json();
    const { title, description, imageUrl, categoryId, modules } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    await prisma.module.deleteMany({
      where: {
        trainingId: params.id,
      },
    });

    const training = await prisma.training.update({
      where: {
        id: params.id,
      },
      data: {
        title,
        description: description || null,
        imageUrl: imageUrl || null,
        categoryId: categoryId || null,
        modules: modules && modules.length > 0 ? {
          create: modules.map((mod: { 
            title: string; 
            description: string | null;
            imageUrl: string | null;
            videoUrl: string | null;
            order: number;
          }) => ({
            title: mod.title,
            description: mod.description || null,
            imageUrl: mod.imageUrl || null,
            videoUrl: mod.videoUrl || null,
            order: mod.order,
          })),
        } : undefined,
      },
      include: {
        modules: true,
        category: true,
      },
    });

    return NextResponse.json(training);
  } catch (error) {
    console.error('Training update error:', error);
    return NextResponse.json(
      { error: '研修の更新に失敗しました' },
      { status: 500 }
    );
  }
}
