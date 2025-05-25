# Paypayモバイルオーダーシステム

## 概要

このプロジェクトは、PayPayを使用したモバイルオーダーシステムです。顧客は商品を選択し、PayPayで支払いを行うことができます。店舗側は注文状況を確認し、商品を準備することができます。

> **⚠ 注意:**  
> このプロジェクトは、PayPayのモバイルオーダーシステムを模倣したものであり、実際の決済処理は行われません。テスト環境での使用を目的としています。  
> 使用する際には自己責任で行なってください。本番環境での使用は推奨されません。もしも本番環境で損失が発生した場合、当方は一切の責任を負いません。

## 主な機能

*   **クライアントサイド ([client](./client))**
    *   商品一覧表示と選択
    *   PayPay QRコード決済
    *   決済結果表示
    *   オーダー呼び出し状況表示 ([client/callNumberDisplay.html](client/callNumberDisplay.html))
    *   オーナー向け管理ページ ([client/ownerPage.html](client/ownerPage.html))
        *   Firebase Authenticationによるログイン認証
        *   商品情報の管理（追加・編集）
*   **サーバーサイド ([backend](./backend))**
    *   商品情報提供API
    *   PayPay決済API連携 (QRコード生成、決済ステータス確認)
    *   Firebase Firestoreとの連携 (注文データ保存、商品データ管理)

## 使用技術

*   **フロントエンド:**
    *   React
    *   TypeScript
    *   Vite
    *   Material-UI
    *   Firebase (Authentication, Firestore)
    *   Zod (データバリデーション)
*   **バックエンド:**
    *   Node.js
    *   Express
    *   TypeScript
    *   PayPay OPA SDK (`@paypayopa/paypayopa-sdk-node`)
    *   Firebase (Firestore)
    *   Zod (データバリデーション)
*   **共通:**
    *   pnpm (パッケージマネージャー)

## セットアップと実行方法

### 1. リポジトリのクローン

```bash
git clone https://github.com/takusandayooo/paypay-mobile-order-system
cd paypay-mobile-order-system
```

### 2. 環境変数の設定

それぞれのディレクトリに`.env`ファイルを作成し、対応する`.env.example`ファイルの内容を参考に環境変数を設定してください。

*   `client/.env.example` をコピーして `client/.env` を作成し、Firebase関連のVite用環境変数を設定します。
    *   [client/.env.example](./client/.env.example)
*   `backend/.env.example` をコピーして `backend/.env` を作成し、PayPay APIキーおよびFirebase関連の環境変数を設定します。
    *   [backend/.env.example](./backend/.env.example)

### 3. バックエンド ([backend](./backend))

```bash
cd backend
pnpm install
pnpm ts-node server.ts
```
サーバーはデフォルトでポート3000で起動します。

### 4. フロントエンド ([client](./client))

```bash
cd client
pnpm install
```


## ビルド

### フロントエンド

```bash
cd client
pnpm build
```
ビルドされた静的ファイルは `client/dist` ディレクトリに出力されます。

## テスト

### テスト環境のセットアップ

#### 1. テスト用環境変数の設定

[`backend`](./backend )ディレクトリに`.env.testing`ファイルを作成し、以下の環境変数を設定してください：

```
# PayPay Sandbox テストユーザー情報
PAYPAY_SANDBOX_TEST_USER_PHONE=あなたのテスト用電話番号
PAYPAY_SANDBOX_TEST_USER_PASSWORD=あなたのテスト用パスワード

```

#### 2. テストの実行

テストを実行するには以下のコマンドを使用します：

```bash
cd backend
pnpm test
```

または特定のテストファイルを指定：

```bash
pnpm jest module.test.ts
```

### 注意事項

1. **PayPay決済の手動完了**: 
   - Puppeteerによる自動テストは、PayPayのログイン画面までを自動化していますが、決済の最終確認は手動で行う必要があります。
   - テスト実行時に、自動的にブラウザが開き、PayPayのログイン画面が表示されます。
   - OTPコードを入力後、「支払い」ボタンを**手動で**クリックしてください。

2. **テスト実行時の画面キャプチャ**:
   - テスト実行後、`after_login_click.png`という画面キャプチャがbackendディレクトリに保存されます。
   - このキャプチャを確認してテストの実行状況を確認できます。

3. **テストデータのクリーンアップ**:
   - テスト終了後、テストで作成されたデータは自動的にクリーンアップされます。
   - ただし、何らかの理由でテストが途中で失敗した場合は、手動でデータをクリーンアップする必要があるかもしれません。

### モック化されていない統合テスト

このテストスイートは実際のPayPay APIやFirebaseと統合されており、モック化されていません。そのため、以下の点に注意してください：

- テスト実行にはインターネット接続が必要です
- テスト実行中は実際のFirebaseデータベースに変更が加えられます
- PayPayのサンドボックス環境に対して実際のAPI呼び出しが行われます

詳細なテスト内容と各テストケースについては、module.test.tsファイルを参照してください。

## APIエンドポイント (バックエンド)

*   `GET /foodItem`: 商品一覧を取得
*   `POST /cash_from_paypay`: PayPay決済用QRコードを生成
*   `POST /get_payment_status`: 決済ステータスを確認
*   その他、静的ファイル配信用のエンドポイント

## HTMLエントリーポイント (クライアント)

*   [client/index.html](./client/index.html): メインの顧客向け注文ページ
*   [client/paymentResult.html](./client/paymentResult.html): 決済結果表示ページ
*   [client/callNumberDisplay.html](./client/callNumberDisplay.html): オーダー呼び出し状況表示ページ
*   [client/ownerPage.html](./client/ownerPage.html): オーナー向け管理ページ

## ディレクトリ構成

```
.
├── backend/                # バックエンドサーバー (Node.js, Express)
│   ├── src/
│   │   ├── common.schema.ts  # Zodスキーマ (バックエンド用)
│   │   ├── config.ts         # 環境変数読み込み
│   │   ├── firebase.ts       # Firebase関連処理
│   │   └── paypay.ts         # PayPay API連携処理
│   ├── .env                # 環境変数ファイル (Git管理外)
│   ├── .env.example        # 環境変数ファイル例
│   ├── package.json
│   ├── server.ts           # Expressサーバーエントリーポイント
│   └── tsconfig.json
├── client/                # フロントエンド (React, Vite)
│   ├── src/
│   │   ├── App.tsx             # メインアプリケーションコンポーネント
│   │   ├── CallNumberDisplay.tsx # 呼び出し番号表示コンポーネント
│   │   ├── common.schema.ts    # Zodスキーマ (フロントエンド用)
│   │   ├── firebase.ts         # Firebase関連処理 (クライアント用)
│   │   ├── loginPage.tsx       # オーナー向け管理ページ (商品管理など)
│   │   ├── ownerPage.tsx       # オーナーページ認証コンポーネント
│   │   └── paymentResult.tsx   # 決済結果表示コンポーネント
│   ├── .env                # 環境変数ファイル (Git管理外)
│   ├── .env.example        # 環境変数ファイル例
│   ├── index.html          # メインページエントリー
│   ├── callNumberDisplay.html # 呼び出し番号表示ページエントリー
│   ├── ownerPage.html      # オーナーページエントリー
│   ├── paymentResult.html  # 決済結果ページエントリー
│   ├── package.json
│   ├── vite.config.ts      # Vite設定ファイル
│   └── tsconfig.json
└── README.md               # このファイル
```