# LINE公式アカウント登録誘導の設定

## 環境変数の設定

予約確定後の確認画面でLINE登録に誘導するために、以下の環境変数を設定してください。

### ローカル環境（.env.local）

```env
NEXT_PUBLIC_LINE_URL=https://lin.ee/YOUR_LINE_ID
NEXT_PUBLIC_LINE_QR_CODE_URL=https://example.com/line-qr-code.png
```

### 本番環境（Vercel）

Vercelダッシュボードで以下の環境変数を設定してください：

1. **Settings** → **Environment Variables** に移動
2. 以下の変数を追加：

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `NEXT_PUBLIC_LINE_URL` | LINE公式アカウントのURL | `https://lin.ee/abc123` または `https://page.line.me/xxxxx` |
| `NEXT_PUBLIC_LINE_QR_CODE_URL` | LINE QRコード画像のURL（任意） | `https://example.com/line-qr.png` |

## LINE URLの取得方法

### 方法1: LINE公式アカウントマネージャーから

1. [LINE公式アカウントマネージャー](https://manager.line.biz/) にログイン
2. 該当のアカウントを選択
3. **設定** → **基本設定** → **アカウント情報**
4. **友だち追加URL** をコピー

### 方法2: LINE公式アカウントの設定から

1. LINE公式アカウントの設定画面を開く
2. **友だち追加** の設定からURLを取得
3. 通常は `https://lin.ee/XXXXX` または `https://page.line.me/XXXXX` の形式

## QRコード画像の準備（オプション）

QRコードを表示する場合：

1. LINE公式アカウントマネージャーからQRコードをダウンロード
2. 画像をホスティング（Vercelの`public`フォルダ、または外部ストレージ）
3. `NEXT_PUBLIC_LINE_QR_CODE_URL` に画像のURLを設定

### publicフォルダに配置する場合

```bash
# 画像を public/line-qr.png に配置
# 環境変数は設定不要（自動的に /line-qr.png でアクセス可能）
```

コード内で直接指定する場合：
```tsx
<img src="/line-qr.png" alt="LINE QRコード" />
```

## 表示内容

確認画面に以下の内容が表示されます：

- **LINE登録への誘導セクション**（緑色のグラデーション背景）
- **LINEで友だち追加ボタン**（LINE公式アカウントのURLにリンク）
- **QRコード画像**（設定した場合）
- **説明文**（LINE登録のメリット）

## 注意事項

- `NEXT_PUBLIC_` で始まる環境変数は、クライアント側でもアクセス可能です
- LINE URLが設定されていない場合、デフォルトのプレースホルダーURLが使用されます
- QRコード画像は任意です。設定しない場合は表示されません

