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
    *   [client/.env.example](client/.env.example)
*   `backend/.env.example` をコピーして `backend/.env` を作成し、PayPay APIキーおよびFirebase関連の環境変数を設定します。
    *   [backend/.env.example](backend/.env.example)

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

## APIエンドポイント (バックエンド)

*   `GET /foodItem`: 商品一覧を取得
*   `POST /cash_from_paypay`: PayPay決済用QRコードを生成
*   `POST /get_payment_status`: 決済ステータスを確認
*   その他、静的ファイル配信用のエンドポイント

## HTMLエントリーポイント (クライアント)

*   [client/index.html](client/index.html): メインの顧客向け注文ページ
*   [client/paymentResult.html](client/paymentResult.html): 決済結果表示ページ
*   [client/callNumberDisplay.html](client/callNumberDisplay.html): オーダー呼び出し状況表示ページ
*   [client/ownerPage.html](client/ownerPage.html): オーナー向け管理ページ

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