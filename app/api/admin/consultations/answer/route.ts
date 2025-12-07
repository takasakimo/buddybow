import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';

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
    const { consultationId, answer } = body;

    if (!consultationId || !answer) {
      return NextResponse.json(
        { error: 'consultationIdとanswerが必要です' },
        { status: 400 }
      );
    }

    // 相談を取得
    const consultation = await prisma.consultation.findUnique({
      where: { id: consultationId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!consultation) {
      return NextResponse.json(
        { error: '相談が見つかりません' },
        { status: 404 }
      );
    }

    // 相談に回答を追加
    const updatedConsultation = await prisma.consultation.update({
      where: { id: consultationId },
      data: {
        answer: answer.trim(),
        answeredAt: new Date(),
        status: 'answered',
      },
    });

    // 受講者にメール通知を送信
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
        to: consultation.user.email,
        subject: `【buddybow】ご相談への回答が届きました`,
        html: `
          <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #B08968; border-bottom: 2px solid #B08968; padding-bottom: 10px;">
              ご相談への回答が届きました
            </h2>
            
            <p style="color: #333; line-height: 1.6;">
              ${consultation.user.name}様<br><br>
              この度は、buddybowにご相談いただき、誠にありがとうございます。<br>
              ご相談いただいた内容への回答をお送りいたします。
            </p>
            
            <div style="background-color: #FAF9F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #B08968; margin-top: 0;">ご相談内容</h3>
              <p style="color: #333; font-weight: bold; margin-bottom: 10px;">${consultation.title}</p>
              <p style="color: #666; white-space: pre-wrap;">${consultation.content}</p>
            </div>
            
            <div style="background-color: #FFF8F0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #B08968;">
              <h3 style="color: #B08968; margin-top: 0;">回答</h3>
              <p style="color: #333; white-space: pre-wrap; line-height: 1.8;">${answer}</p>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              ご不明な点がございましたら、<a href="https://buddybow.vercel.app/mypage/consultation" style="color: #B08968;">マイページ</a>から再度ご相談ください。
            </p>
          </div>
        `,
        text: `
ご相談への回答が届きました

${consultation.user.name}様

この度は、buddybowにご相談いただき、誠にありがとうございます。
ご相談いただいた内容への回答をお送りいたします。

ご相談内容:
${consultation.title}
${consultation.content}

回答:
${answer}

ご不明な点がございましたら、マイページから再度ご相談ください。
        `,
      };

      await transporter.sendMail(mailOptions);
    } catch (emailError) {
      console.error('Email send error:', emailError);
      // メール送信に失敗しても回答は保存される
    }

    return NextResponse.json({ success: true, consultation: updatedConsultation });
  } catch (error) {
    console.error('Consultation answer error:', error);
    return NextResponse.json(
      { error: '回答の送信に失敗しました' },
      { status: 500 }
    );
  }
}

