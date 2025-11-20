import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
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

    const training = await prisma.training.create({
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

    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error('Training creation error:', error);
    return NextResponse.json(
      { error: '研修の作成に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '権限がありません' },
        { status: 403 }
      );
    }

    const trainings = await prisma.training.findMany({
      include: {
        modules: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(trainings);
  } catch (error) {
    console.error('Trainings fetch error:', error);
    return NextResponse.json(
      { error: '研修の取得に失敗しました' },
      { status: 500 }
    );
  }
}
