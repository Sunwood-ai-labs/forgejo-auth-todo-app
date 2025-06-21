# 🔐 Forgejo認証TODOアプリ

Forgejo APIを使用した認証機能付きTODOアプリケーションです。Forgejoのユーザー名・パスワード、またはAPIトークンを使用してログインし、個人のTODOを管理できます。

## 🌟 特徴

- **🔒 簡単ログイン**: Forgejoのユーザー名・パスワードでそのままログイン
- **🔑 APIトークン対応**: 高度なユーザー向けAPIトークン認証
- **📋 高機能TODO管理**: タスクの追加、編集、削除、完了管理
- **🎯 優先度設定**: タスクに優先度（高・中・低）を設定可能
- **🔍 フィルタリング**: ステータス（全て・未完了・完了済み）と優先度でフィルタリング
- **📊 統計表示**: TODO数、完了率などのリアルタイム統計情報
- **💾 ローカル保存**: ブラウザのローカルストレージにデータを安全に保存
- **📱 レスポンシブ**: モバイルデバイスにも完全対応
- **🌙 モダンUI**: 直感的で使いやすいインターフェース
- **👥 複数ユーザー対応**: 各ユーザーが自分のアカウントでログイン可能

## 🚀 使い方

### 1. 簡単ログイン（推奨）

1. **Forgejo URL**: `http://192.168.0.131:3000/`（プリセット済み）
2. **ユーザー名**: あなたのForgejoユーザー名を入力
3. **パスワード**: あなたのForgejoパスワードを入力
4. **「ログイン」**ボタンをクリック
5. 認証成功後、TODOアプリが使用可能になります

### 2. APIトークンでのログイン

高度なユーザー向け：

1. **「APIトークンでログイン」**をクリック
2. Forgejoでアクセストークンを生成：
   - Forgejoにログイン → 右上のアバター → **設定**
   - **アプリケーション** → **アクセストークンの管理**
   - **新しいトークンを生成**（`read:user`権限を選択）
3. 生成したトークンを入力してログイン

### 3. TODO管理

- **新しいTODO追加**: タイトル、説明、優先度を設定して追加
- **TODO編集**: 編集ボタンで既存TODOを修正
- **完了/未完了切り替え**: チェックボタンでステータス変更
- **TODO削除**: 削除ボタンで不要なTODOを削除
- **フィルタリング**: ステータスや優先度でTODOを絞り込み

## 🛠️ 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **認証**: Forgejo Basic認証 + REST API
- **データ保存**: Browser LocalStorage
- **スタイリング**: CSS Grid, Flexbox, CSS Animations
- **アイコン**: Font Awesome 6
- **CORS対応**: Forgejoサーバー側CORS設定

## 📁 プロジェクト構造

```
forgejo-auth-todo-app/
├── index.html              # メインHTMLファイル
├── style.css               # スタイルシート
├── forgejo-auth.js         # Forgejo API認証クラス
├── todo-app.js             # TODOアプリケーション管理クラス
├── app.js                  # メインアプリケーションファイル
├── forgejo-cors-config.ini # Forgejo CORS設定ファイル
├── cors-solution.md        # CORSエラー解決ガイド
├── README.md               # このファイル
├── LICENSE                 # ライセンス（MIT）
└── .gitignore              # Git除外設定
```

## 🔧 開発・カスタマイズ

### ローカル開発環境

```bash
# プロジェクトをクローン
git clone <repository-url>
cd forgejo-auth-todo-app

# ローカルサーバーを起動
python3 -m http.server 8888

# ブラウザでアクセス
open http://localhost:8888
```

### 主要なクラス

#### `ForgejoAuth`クラス
- Forgejo Basic認証 + API認証の管理
- ユーザー情報の取得
- API呼び出しの抽象化

```javascript
// Basic認証ログイン
const auth = new ForgejoAuth();
await auth.loginWithCredentials(username, password, baseUrl);

// APIトークンログイン
await auth.loginWithToken(token, baseUrl);
const userInfo = auth.getUserInfo();
```

#### `TodoApp`クラス
- TODO管理機能
- ローカルストレージでの永続化
- UI更新とイベント処理

```javascript
// 使用例
const app = new TodoApp();
app.initialize();
app.addTodo();
```

### カスタマイズポイント

1. **スタイル変更**: [`style.css`](style.css) でUIをカスタマイズ
2. **機能追加**: [`todo-app.js`](todo-app.js) で新機能を実装
3. **API拡張**: [`forgejo-auth.js`](forgejo-auth.js) でForgejo API機能を追加
4. **認証方式**: [`app.js`](app.js) で認証フローを調整

## 🔐 セキュリティ考慮事項

- **Basic認証**: ユーザー名・パスワードを安全にエンコード
- **認証情報**: ローカルストレージに暗号化して保存（7日間有効）
- **HTTPS推奨**: 本番環境ではHTTPS経由でのアクセスを推奨
- **最小権限**: 必要最小限の権限のみ要求
- **セッション管理**: 安全なログアウト機能

## 🌐 対応Forgejoインスタンス

以下の環境でテスト済み：

- **ローカルForgejo**: `http://192.168.0.131:3000/`
- [Codeberg](https://codeberg.org)
- [Disroot Git](https://git.disroot.org)
- [Chapril Forge](https://forge.chapril.org)

その他のForgejoインスタンスでも動作するはずです。

## 📱 対応ブラウザ

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 🎯 主要機能

### 認証機能
- [x] Forgejo Basic認証（ユーザー名・パスワード）
- [x] Forgejo APIトークン認証
- [x] 認証情報の自動保存・復元
- [x] 接続テスト機能
- [x] セッション管理

### TODO管理機能
- [x] TODO追加・編集・削除
- [x] 優先度設定（高・中・低）
- [x] 完了状態管理
- [x] 詳細説明対応
- [x] 作成日時・完了日時記録

### UI/UX機能
- [x] レスポンシブデザイン
- [x] 認証方式の切り替え
- [x] モーダルダイアログ
- [x] トーストメッセージ
- [x] アニメーション効果
- [x] キーボードショートカット

### データ管理機能
- [x] ローカルストレージ永続化
- [x] 統計情報表示
- [x] フィルタリング機能
- [x] データエクスポート・インポート（準備中）

## 🔮 今後の拡張予定

- [ ] **Forgejo Issues連携**: ForgejoのIssuesとTODOを同期
- [ ] **データエクスポート**: JSON形式でのTODOデータエクスポート
- [ ] **テーマ切り替え**: ダーク/ライトモード対応
- [ ] **多言語対応**: 英語版の提供
- [ ] **オフライン対応**: Service Workerによるオフライン機能
- [ ] **タグ機能**: TODOにタグを付けて分類
- [ ] **期限設定**: TODO完了期限の設定機能
- [ ] **チーム機能**: 複数ユーザーでのTODO共有

## 🛠️ セットアップとトラブルシューティング

### Forgejo CORS設定

CORSエラーが発生する場合、Forgejoの設定ファイル（`app.ini`）に以下を追加：

```ini
[cors]
ENABLED = true
ALLOW_DOMAIN = localhost:8888,127.0.0.1:8888
ALLOW_SUBDOMAIN = false
METHODS = GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
MAX_AGE = 86400
ALLOW_CREDENTIALS = true
```

設定後、Forgejoサーバーを再起動してください。

### よくある問題

**Q: ログインできません**
A: 以下を確認してください：
- Forgejo URLが正しいか（`http://192.168.0.131:3000/`）
- ユーザー名・パスワードが正しいか
- ForgejoサーバーにCORS設定が追加されているか

**Q: TODOが保存されません**
A: ブラウザのローカルストレージが有効になっているか確認してください。

**Q: モバイルで表示が崩れます**
A: 最新のブラウザを使用し、JavaScriptが有効になっているか確認してください。

### デバッグ機能

開発環境（localhost）では、ブラウザのコンソールで以下のデバッグ機能が利用できます：

```javascript
// 認証情報の確認
debug.forgejoAuth.getUserInfo()

// TODO一覧の表示
debug.todoApp.todos

// ダッシュボードの強制表示
debug.showDashboard()
```

## 🤝 コントリビューション

プルリクエスト歓迎です！以下の点にご注意ください：

1. **コーディング規約**: 既存コードのスタイルに合わせてください
2. **日本語コメント**: コメントは日本語で記述してください
3. **テスト**: 新機能追加時は動作確認をお願いします
4. **ドキュメント**: README更新も忘れずにお願いします

### 開発原則

- **DRY**: 重複コードの排除
- **KISS**: シンプルで理解しやすいコード
- **責務の分離**: 機能ごとにクラス・関数を分割
- **防御的プログラミング**: エラーハンドリングの徹底

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルをご確認ください。

## 🆘 サポート

問題や質問がある場合は、GitHubのIssuesでお知らせください。

## 🎊 完成記念

このアプリケーションは、Forgejoコミュニティのために作成されました。シンプルで使いやすいTODO管理を通じて、日々の開発作業がより効率的になることを願っています。

---

**🚀 Happy Coding with Forgejo TODO App!**

---

**免責事項**: このアプリケーションはサードパーティ製品であり、Forgejo公式プロジェクトとは関係ありません。
