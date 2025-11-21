import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
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

    await prisma.announcement.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Announcement deletion error:', error);
    return NextResponse.json(
      { error: 'お知らせの削除に失敗しました' },
      { status: 500 }
    );
  }
}
