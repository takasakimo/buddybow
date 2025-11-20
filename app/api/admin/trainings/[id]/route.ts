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

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, imageUrl, modules } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'タイトルは必須です' },
        { status: 400 }
      );
    }

    // 既存のモジュールを削除して新しいものを作成
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
        modules: modules && modules.length > 0 ? {
          create: modules.map((mod: { title: string; description: string; order: number }) => ({
            title: mod.title,
            description: mod.description || null,
            order: mod.order,
          })),
        } : undefined,
      },
      include: {
        modules: true,
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
