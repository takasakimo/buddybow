# メール送信機能の設定

## 必要な環境変数

予約確定時にメールを送信するために、以下の環境変数を設定してください。

### ローカル環境（.env）

```env
# SMTP設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@buddybow.com
```

### 本番環境（Vercel）

Vercelダッシュボードで以下の環境変数を設定してください：

1. **Settings** → **Environment Variables** に移動
2. 以下の変数を追加：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `SMTP_HOST` | SMTPサーバーのホスト | `smtp.gmail.com` |
| `SMTP_PORT` | SMTPポート番号 | `587` |
| `SMTP_USER` | SMTP認証用のメールアドレス | `your-email@gmail.com` |
| `SMTP_PASS` | SMTP認証用のパスワード（アプリパスワード） | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | 送信元メールアドレス（表示名） | `buddybow <noreply@buddybow.com>` |

## Gmailを使用する場合

1. Googleアカウントの設定で「2段階認証」を有効化
2. 「アプリパスワード」を生成
3. 生成されたパスワードを `SMTP_PASS` に設定

## その他のメールサービス

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## メール送信先

- **管理者宛て**: `info@aims-ngy.com`
- **予約者宛て**: 予約フォームで入力されたメールアドレス

## 動作確認

1. 予約ページ（`/consultation`）で予約を確定
2. `info@aims-ngy.com` に予約内容のメールが届く
3. 予約者にも確認メールが届く

