# CLAUDE.md

## プロジェクト概要

Oura Ring API v2からデータを取得し、Google Calendarに同期するGoogle Apps Script (GAS)。

## 技術スタック

- Google Apps Script (GAS)
- clasp - GASのローカル開発ツール
- OAuth2 for Apps Script ライブラリ (v43)

## 開発ワークフロー

```bash
npm run push   # ローカル → GASにデプロイ
npm run pull   # GAS → ローカルに取得
npm run watch  # 変更を監視して自動push
```

テストはGASエディタで関数を手動実行。

## ファイル構成

| ファイル | 役割 |
|---------|------|
| main.gs | エントリーポイント、OAuth2認証関数、トリガー設定 |
| config.gs | 設定管理、定数定義 |
| ouraApi.gs | Oura APIクライアント |
| calendarService.gs | Google Calendar操作、重複検出 |
| syncService.gs | 同期ロジック |
| formatters.gs | イベントタイトル・説明のフォーマット |
| utils.gs | 共通ユーティリティ |

## 重要な注意点

### OAuth2ライブラリのバージョン

**必ずバージョン43を使用すること。**

```json
{
  "userSymbol": "OAuth2",
  "libraryId": "1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF",
  "version": "43"
}
```

バージョン46などの新しいバージョンでは`NOT_FOUND`エラーが発生する。

### Oura API認証方式の変更

- **Personal Access Token (PAT) は2025年12月に非推奨**
- OAuth2認証を使用すること
- Oura Developer Portalも変更: https://developer.ouraring.com/applications
  - 旧URL `https://cloud.ouraring.com/oauth/applications` は無効

### SpO2データについて

- PATでは取得できなかった（401エラー）
- OAuth2では`spo2`スコープを含めることで取得可能
- ただし、ユーザーの契約状況やリングのモデルによっては取得できない場合もある

## Oura API v2

ドキュメント: https://cloud.ouraring.com/v2/docs

### エンドポイント

| データ | エンドポイント |
|--------|---------------|
| 睡眠詳細 | `v2/usercollection/sleep` |
| 日次睡眠スコア | `v2/usercollection/daily_sleep` |
| ワークアウト | `v2/usercollection/workout` |
| 日次Readiness | `v2/usercollection/daily_readiness` |
| 日次ストレス | `v2/usercollection/daily_stress` |
| 日次アクティビティ | `v2/usercollection/daily_activity` |
| 日次SpO2 | `v2/usercollection/daily_spo2` |

## OAuth2スコープ

全8種: `email personal daily heartrate workout tag session spo2`

## Script Properties

| キー | 必須 | 説明 |
|------|------|------|
| OURA_CLIENT_ID | Yes | OAuth Client ID |
| OURA_CLIENT_SECRET | Yes | OAuth Client Secret |
| CALENDAR_ID | Yes | 同期先カレンダーID |
| SYNC_DAYS | No | 同期日数（デフォルト: 7） |
