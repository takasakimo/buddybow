# BuddyBow

通信業界の即戦力になるための研修管理システム

## 機能

- ユーザー認証・管理
- 研修プログラムの管理と受講
- 勉強会の管理
- お知らせ機能
- マイページ（進捗管理、ロードマップ、日報、相談など）
- 受講者マイページ管理（管理者機能）

## 技術スタック

- **フレームワーク**: Next.js 14.2.33
- **データベース**: PostgreSQL (Prisma ORM)
- **認証**: NextAuth.js
- **スタイリング**: Tailwind CSS
- **エディタ**: TipTap

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、必要な環境変数を設定してください：

```bash
cp .env.example .env
```

必要な環境変数：
- `DATABASE_URL`: PostgreSQLデータベースの接続URL
- `DIRECT_URL`: 直接接続用のデータベースURL（Prisma Migrate用）
- `NEXTAUTH_URL`: アプリケーションのURL（本番環境では本番URL）
- `NEXTAUTH_SECRET`: NextAuthのシークレットキー（ランダムな文字列）

### 3. データベースのセットアップ

```bash
# Prismaクライアントの生成
npx prisma generate

# データベースマイグレーション
npx prisma migrate dev

# （オプション）Prisma Studioでデータベースを確認
npx prisma studio
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定：
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_URL` (本番環境のURL)
   - `NEXTAUTH_SECRET` (ランダムな文字列を生成)

4. ビルドコマンドは自動検出されます（`npm run build`）

### ビルドコマンド

```bash
npm run build
```

### 本番環境でのデータベースマイグレーション

Vercelのデプロイ後、データベースマイグレーションを実行：

```bash
npx prisma migrate deploy
```

または、Vercelの環境変数に`POSTINSTALL_BUILD`を設定して自動実行することもできます。

## スクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - 本番用ビルドを作成
- `npm run start` - 本番サーバーを起動
- `npm run lint` - ESLintでコードをチェック

## プロジェクト構造

```
buddybow/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者ページ
│   ├── api/               # APIルート
│   ├── dashboard/         # ダッシュボード
│   ├── mypage/            # マイページ
│   └── trainings/         # 研修ページ
├── components/            # 再利用可能なコンポーネント
├── lib/                   # ユーティリティ関数
├── prisma/                # Prismaスキーマとマイグレーション
└── public/                # 静的ファイル
```

## ライセンス

このプロジェクトはプライベートプロジェクトです。
