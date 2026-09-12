# couple-trip-planner-ui

カップル向け旅行計画アプリ **Couple Trip Planner** の、**UI確認専用** React + TypeScript + Vite デモです。

このリポジトリは **スマホ / デスクトップでの画面確認用** に作られており、バックエンド、SQLite、Gemini API、TimeTree API には接続しません。`npm install` と `npm run dev` だけでそのまま動作します。

## 特徴

- モバイルファーストのレスポンシブUI
- メインUIは日本語表示
- localStorage によるローカル保存
- デモ用の旅行サマリー、旅程一覧、リマインダー、AI提案、TimeTree状態カードを同梱
- 削除確認付きの旅程追加 / 削除フォーム
- ブラウザ通知要求 + アプリ内通知フォールバック
- モック固定ロジックによる AI 旅行提案
- ネットワーク不要で動く Vitest + React Testing Library テスト

## セットアップ

```bash
npm install
npm run dev
```

Vite の開発サーバー起動後、ブラウザで表示される URL を Android / PC から開いて確認してください。

## 利用可能なスクリプト

```bash
npm run dev        # 開発サーバー
npm run test       # Vitest 実行
npm run build      # TypeScript チェック + 本番ビルド
npm run preview    # ビルド結果のプレビュー
npm run lint       # oxlint
```

## デモの挙動

- 初回表示時はサンプル旅行「週末箱根リフレッシュ旅行」を読み込みます。
- 旅程追加・削除は localStorage に保存され、再読み込み後も残ります。
- 「デモを初期化」で localStorage を消してサンプル状態に戻せます。
- AI パネルは **モックモード** です。行き先と質問を入れると、固定ロジックでホテル・観光・食事・日程提案を返します。
- TimeTree カードは **未設定表示のまま** で、実際の連携は行いません。
- 通知 API が使えない場合でも、画面内メッセージで通知内容を確認できます。

## localStorage のリセット方法

画面右上の **「デモを初期化」** ボタンを押すか、ブラウザ開発者ツールから次のキーを削除してください。

```text
couple-trip-planner-ui-demo
```

## フルスタック版との関係

本リポジトリは、フルスタック版の `Ruya221/couple-trip-planner` に対する **UIデモ / 画面確認用** リポジトリです。

- `Ruya221/couple-trip-planner`
  - 将来的な本体アプリ想定
  - バックエンドやDB連携を含む実装先
- `Ruya221/couple-trip-planner-ui`
  - このリポジトリ
  - UI と操作感をすぐ確認するための公開デモ

## テスト・ビルド実行結果

以下のコマンドをローカルで実行し、成功を確認しました。

```bash
npm run lint
npm run test
npm run build
```

実行結果:

- `npm run lint`
  - `oxlint` 実行、警告・エラーなし
- `npm run test`
  - `Test Files  1 passed (1)`
  - `Tests  6 passed (6)`
- `npm run build`
  - `tsc -b && vite build` 成功
  - 本番用 `dist/` を生成できることを確認

## CI

GitHub Actions CI を追加しており、`npm ci` → `npm run test` → `npm run build` を実行します。
