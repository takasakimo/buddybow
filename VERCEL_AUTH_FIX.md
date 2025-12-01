# Vercel認証保護の解除方法

## 問題
ランディングページ（`/lp`）にアクセスすると、Vercelのログイン画面が表示されて見れない。

## 解決方法

### 方法1: Vercelダッシュボードで設定を変更（推奨）

1. **Vercelダッシュボードにアクセス**
   - https://vercel.com にログイン
   - プロジェクト「buddybow」を選択

2. **Settings（設定）を開く**
   - 左側のメニューから「Settings」をクリック

3. **Vercel Authenticationを無効化**
   - 「General」セクションを開く
   - 「Vercel Authentication」または「Password Protection」を探す
   - 設定を「Disabled」に変更
   - 保存

4. **確認**
   - 再度 https://buddybow.vercel.app/lp にアクセス
   - ログイン画面が表示されず、ランディングページが表示されることを確認

### 方法2: プロジェクト設定の確認

もし「Vercel Authentication」の設定が見つからない場合：

1. **Deployment Protectionの確認**
   - Settings → Deployment Protection
   - パスワード保護が有効になっていないか確認
   - 有効な場合は無効化

2. **Team/Organization設定の確認**
   - Team設定で認証保護が有効になっていないか確認

## アプリケーション側の確認

ランディングページ（`/lp`）は認証不要になっているはずですが、念のため確認：

- `/app/lp/page.tsx` - 認証チェックなし ✓
- `/components/BuddyBowLP.tsx` - 認証チェックなし ✓

## デプロイ後の確認

設定変更後、再度デプロイする必要はありませんが、念のため確認：

```bash
cd /Users/takasakimotonobu/buddybow
vercel --prod
```

## 参考URL

- プロジェクトURL: https://vercel.com/aims-projects-264acc6a/buddybow
- 本番URL: https://buddybow.vercel.app/lp

