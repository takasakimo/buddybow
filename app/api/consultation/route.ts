import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, time, name, email, phone, message } = body;

    // バリデーション
    if (!date || !time || !name || !email) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // メール送信設定
    // 環境変数からSMTP設定を取得（設定されていない場合はデフォルト値を使用）
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 予約日時のフォーマット
    const reservationDate = new Date(date);
    const formattedDate = reservationDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    // 管理者宛てメール（info@aims-ngy.com）
    const adminMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'info@aims-ngy.com',
      subject: `【buddybow】無料相談の予約が入りました - ${name}様`,
      html: `
        <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #B08968; border-bottom: 2px solid #B08968; padding-bottom: 10px;">
            無料相談の予約が入りました
          </h2>
          
          <div style="background-color: #FAF9F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #B08968; margin-top: 0;">予約情報</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px;">日時:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} ${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">お名前:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">メールアドレス:</td>
                <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">電話番号:</td>
                <td style="padding: 8px 0; color: #333;">${phone}</td>
              </tr>
              ` : ''}
              ${message ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666; vertical-align: top;">ご質問・ご要望:</td>
                <td style="padding: 8px 0; color: #333; white-space: pre-wrap;">${message}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            この予約は <a href="https://buddybow.vercel.app/consultation" style="color: #B08968;">予約管理ページ</a> で確認できます。
          </p>
        </div>
      `,
      text: `
無料相談の予約が入りました

予約情報:
日時: ${formattedDate} ${time}
お名前: ${name}
メールアドレス: ${email}
${phone ? `電話番号: ${phone}` : ''}
${message ? `ご質問・ご要望: ${message}` : ''}
      `,
    };

    // 予約者宛て確認メール
    const userMailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: '【buddybow】無料相談の予約を承りました',
      html: `
        <div style="font-family: 'Hiragino Sans', 'Meiryo', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #B08968; border-bottom: 2px solid #B08968; padding-bottom: 10px;">
            予約を承りました
          </h2>
          
          <p style="color: #333; line-height: 1.6;">
            ${name}様<br><br>
            この度は、buddybowの無料相談にお申し込みいただき、誠にありがとうございます。<br>
            以下の内容で予約を承りました。
          </p>
          
          <div style="background-color: #FAF9F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #B08968; margin-top: 0;">予約内容</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666; width: 120px;">日時:</td>
                <td style="padding: 8px 0; color: #333;">${formattedDate} ${time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">お名前:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">メールアドレス:</td>
                <td style="padding: 8px 0; color: #333;">${email}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #FFF8F0; border-left: 4px solid #B08968; padding: 15px; margin: 20px 0;">
            <h4 style="color: #B08968; margin-top: 0;">無料相談で得られるもの</h4>
            <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>現状の「行動ブレーキ」の特定</li>
              <li>あなたに合った副業ジャンルの提案</li>
              <li>90日間のリブートロードマップ案</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            ご不明な点がございましたら、お気軽にお問い合わせください。<br>
            お問い合わせ先: <a href="mailto:info@aims-ngy.com" style="color: #B08968;">info@aims-ngy.com</a>
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            ※ 予約の変更・キャンセルをご希望の場合は、このメールに返信してお知らせください。
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 20px; text-align: center;">
            buddybow - 伴走型リブートプログラム<br>
            運営: 株式会社aims
          </p>
        </div>
      `,
      text: `
予約を承りました

${name}様

この度は、buddybowの無料相談にお申し込みいただき、誠にありがとうございます。
以下の内容で予約を承りました。

予約内容:
日時: ${formattedDate} ${time}
お名前: ${name}
メールアドレス: ${email}

無料相談で得られるもの:
- 現状の「行動ブレーキ」の特定
- あなたに合った副業ジャンルの提案
- 90日間のリブートロードマップ案

ご不明な点がございましたら、お気軽にお問い合わせください。
お問い合わせ先: info@aims-ngy.com

※ 予約の変更・キャンセルをご希望の場合は、このメールに返信してお知らせください。

buddybow - 伴走型リブートプログラム
運営: 株式会社aims
      `,
    };

    // メール送信
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    return NextResponse.json(
      { message: '予約が完了しました。確認メールを送信しました。' },
      { status: 200 }
    );
  } catch (error) {
    console.error('予約メール送信エラー:', error);
    return NextResponse.json(
      { error: 'メール送信に失敗しました。しばらくしてから再度お試しください。' },
      { status: 500 }
    );
  }
}

