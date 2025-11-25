import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 全権管理者のみアクセス可能
    if (!session || session.user.role !== 'FULL_ADMIN') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, order } = body;

    if (!title || !order) {
      return NextResponse.json(
        { error: 'タイトルと表示順序は必須です' },
        { status: 400 }
      );
    }

    const newModule = await prisma.module.create({
      data: {
        title,
        description: description || null,
        order,
        trainingId: params.id,
      },
    });

    return NextResponse.json(newModule, { status: 201 });
  } catch (error) {
    console.error('Module creation error:', error);
    return NextResponse.json(
      { error: 'チャプターの作成に失敗しました' },
      { status: 500 }
    );
  }
}
