# デプロイ手順

## Vercelでのデプロイ方法

### 方法1: Vercel CLIで直接デプロイ（推奨）

1. **Vercelにログイン**
   ```bash
   vercel login
   ```

2. **プロジェクトをVercelにリンク**
   ```bash
   cd /Users/takasakimotonobu/buddybow
   vercel link
   ```
   - 既存のプロジェクトを選択するか、新規プロジェクトを作成

3. **環境変数を設定**
   Vercelダッシュボードで以下の環境変数を設定：
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (デプロイ後のURLに更新)

4. **デプロイ実行**
   ```bash
   vercel --prod
   ```

### 方法2: GitHubと連携（自動デプロイ）

1. **GitHubにプッシュ**
   ```bash
   git push origin main
   ```

2. **Vercelダッシュボードで接続**
   - https://vercel.com にアクセス
   - "Add New Project" をクリック
   - GitHubリポジトリを選択
   - 環境変数を設定
   - "Deploy" をクリック

   以降、`main`ブランチにプッシュするたびに自動デプロイされます。

## デプロイ後の確認

ランディングページは以下のURLでアクセス可能：
- `https://[your-domain]/lp`

## 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください：
- `DATABASE_URL`: PostgreSQL接続文字列
- `DIRECT_URL`: 直接接続用のPostgreSQL接続文字列
- `NEXTAUTH_SECRET`: 認証用のシークレットキー
- `NEXTAUTH_URL`: デプロイ後のURL（例: `https://your-project.vercel.app`）

