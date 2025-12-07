import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id as string);

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error('Consultations fetch error:', error);
    return NextResponse.json(
      { error: '相談履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'タイトルと内容は必須です' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id as string);

    // ユーザー情報を取得（担当管理者を取得するため）
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        assignedAdminId: true,
        assignedAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // 相談を作成
    const consultation = await prisma.consultation.create({
      data: {
        userId,
        title: title.trim(),
        content: content.trim(),
        status: 'pending',
      },
    });

    // 担当管理者がいる場合、メール通知を送信
    if (user.assignedAdmin && user.assignedAdmin.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const mailOptions = {
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.assignedAdmin.email,
          subject: `【buddybow】新しい相談が届きました - ${user.name}様`,
          html: `
            <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #B08968; border-bottom: 2px solid #B08968; padding-bottom: 10px;">
                新しい相談が届きました
              </h2>
              
              <div style="background-color: #FAF9F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #B08968; margin-top: 0;">相談内容</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px;">受講者:</td>
                    <td style="padding: 8px 0; color: #333;">${user.name}様</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">メール:</td>
                    <td style="padding: 8px 0; color: #333;"><a href="mailto:${user.email}">${user.email}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; vertical-align: top;">タイトル:</td>
                    <td style="padding: 8px 0; color: #333;">${title}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666; vertical-align: top;">内容:</td>
                    <td style="padding: 8px 0; color: #333; white-space: pre-wrap;">${content}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                この相談は <a href="https://buddybow.vercel.app/admin/user-progress/${user.id}" style="color: #B08968;">マイページ管理</a> で確認・回答できます。
              </p>
            </div>
          `,
          text: `
新しい相談が届きました

受講者: ${user.name}様
メール: ${user.email}
タイトル: ${title}
内容: ${content}

この相談は https://buddybow.vercel.app/admin/user-progress/${user.id} で確認・回答できます。
          `,
        };

        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // メール送信に失敗しても相談は作成される
      }
    }

    return NextResponse.json({ success: true, consultation });
  } catch (error) {
    console.error('Consultation creation error:', error);
    return NextResponse.json(
      { error: '相談の作成に失敗しました' },
      { status: 500 }
    );
  }
}

