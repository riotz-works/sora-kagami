# 空鏡 (Sora-Kagami)

空模様を図に写して、天気をお伝えする「空鏡」

![](https://raw.githubusercontent.com/riotz-works/sora-kagami/assets/assets/cover.jpg)


## ⭐️ 概要

現在の天気をレポートする Slack の Slash Commands を提供するサービスです。

主な機能
- `郵便番号` または `地名`、`ランドマーク名` による地点の指定
- 現在の降水強度と１時間後までの予報グラフ表示
- 周辺の降水レーダー地図表示

設定した Slash Commands を `/sora` として、以下のように入力します。
- `/sora 100-0005`
- `/sora 1000005`
- `/sora 東京駅`

空鏡から以下のような返信で「現在の天気」「今後１時間の見通しグラフ」「現在の降水レーダー地図」を確認できます。
![](https://raw.githubusercontent.com/riotz-works/sora-kagami/assets/assets/001.png)


## 🚀 デモ環境の利用方法

空鏡はデモ環境(以降、空鏡デモ)を提供しています。ご利用中の Slack チームへ手軽に導入できます。お試しください。

空鏡デモを導入する Slack チームに Slash Commands をインストールします。  
[Slash Commands | Slack App ディレクトリ](https://my.slack.com/apps/A0F82E8CA-slash-commands)

[コマンドを選択する] では、空鏡デモを呼びたすためのコマンド名を入力します。
Slack のチーム内で重複しなければ任意のコマンド名が使えます。空鏡の `/sora` をお使いいただけると幸いです。(あとで変更できます)

インテグレーションの設定では、以下のように設定し保存します。

| 項目                     | 設定値                                                                        |
|:-------------------------|:------------------------------------------------------------------------------|
| [URL]                    | `https://4tvr294f4h.execute-api.ap-northeast-1.amazonaws.com/qas/sora-kagami` |
| [アイコンをカスタマイズ] | 任意の画像/絵文字 (※後述のアイコンもご利用いただけます)                      |
| [名前をカスタマイズ]     | 任意の文字列 ( e.g. `空鏡` )                                                  |
| [説明]                   | 任意の文字列 ( e.g. `現在の空模様をレポートします` )                          |
| [使い方のヒント]         | 任意の文字列 ( e.g. `[郵便番号 or 地名]` )                                    |

以降、設定した Slack で　`/[コマンド名] [郵便番号 or 地名]` を入力すると、空鏡デモから天気レポートが返信されます。

**アイコン**  
<img src="https://raw.githubusercontent.com/riotz-works/sora-kagami/assets/assets/icon.jpg" width="64" />  

**注意**
- [YOLP API](https://developer.yahoo.co.jp/webapi/map/) の [利用制限](https://developer.yahoo.co.jp/appendix/rate.html) に達すると応答しなくなります
- 画像 (１時間の見通しグラフ、降水レーダー地図) は３日間で削除されます
- 空鏡デモは、事前の告知なく終了、または URL が変更となることがあります


## 🔧 サービスのセットアップ

空鏡は AWS にサーバーレスのサービスとして構築されています。  
本リポジトリのソースコードを使うことで空鏡の環境を構築できます。  


### 📋 動作環境
- Node.js 8.10 (固定)
- Yarn 1.16+
- AWS
- CircleCI (オプション)


### ☁️  AWS アカウントの用意
[AWS](https://aws.amazon.com/) のアカウントとユーザーを作成します。(既存の AWS が利用可能な場合は、新たに作る必要はありません)

コマンドラインから「[Serverless](https://serverless.com/)」を使いデプロイするのでユーザーの「アクセスキー ID」と「シークレットアクセスキー」を作成します。

権限は現在のところ `AdministratorAccess` が必要です。詳しくは「[Serverless Framework - AWS Lambda Guide - Credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/)」を参照してください。また権限を狭める場合は、こちら「[Narrowing the Serverless IAM Deployment Policy · Issue #1439 · serverless/serverless](https://github.com/serverless/serverless/issues/1439)」が参考になります。


### 🆔 Client ID を取得
Yahoo!デベロッパーネットワークにアプリケーション登録し `Client ID` を取得します。

1. Yahoo! JAPAN IDを取得
こちらから登録します。  
※ すでに持っている場合は、新たに取得する必要はありません。
https://account.edit.yahoo.co.jp/registration  

2. アプリケーションを登録
こちらから登録します。  
※ アプリケーションの種類は [サーバーサイド] を選びます。  
https://e.developer.yahoo.co.jp/register  

くわしくは「[ご利用ガイド - Yahoo!デベロッパーネットワーク](https://developer.yahoo.co.jp/start/)」を参照してください。


### 💻 開発環境の構築
本リポジトリのソースコードをダウンロードします。  
プロジェクト・ルート直下の `/package.json` を環境に合わせて編集します。  
とくに `"group": "riotz"` は AWS Lambda デプロイ用 S3 バケットの名前を一意にするため変更が必要です。  
```javascript
{
  "name": "sora-kagami",
  "group": "riotz",
  // ...(省略)
}
```

これまでに取得した各種 ID を環境変数に設定します。
```console
$ export AWS_ACCESS_KEY_ID=<your-key-here>
$ export AWS_SECRET_ACCESS_KEY=<your-secret-key-here>
$ export YOLP_APP_ID=<your-yahoo-app-client-id>
```

AWS にデプロイ用 S3 バケットを作成します。  
デプロイ用バケットの命名ルールは `x-sls-artifacts-[pkg.group]-[region]` です。`region` は、デフォルトで `ap-northeast-1` です。  
e.g. `x-sls-artifacts-riotz-ap-northeast-1`

依存モジュールのインストールをし、デプロイを実行します。
```
$ yarn setup
$ yarn deploy
...(省略)
Serverless: Stack update finished...
Service Information
service: sora-kagami
stage: dev
region: ap-northeast-1
stack: sora-kagami-dev
resources: 19
api keys:
  None
endpoints:
  GET - https://uvhuw8XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/version
  POST - https://uvhuw8XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/sora-kagami
functions:
  Systems: sora-kagami-systems-dev
  Command: sora-kagami-command-dev
layers:
  None
Serverless Enterprise: Run `serverless login` and deploy again to explore, monitor, secure your serverless project for free.
Done in 210.56s.
```

デプロイが完了したら `endpoints` の `POST sora-kagami` の URL を Slack Slash Commands に設定します。  
e.g. `POST - https://uvhuw8XXXX.execute-api.ap-northeast-1.amazonaws.com/dev/sora-kagami`  


### 🔧 設定
- 許可した Slack のみ応答する  
  環境変数 `SLACK_TOKENS` に、Slack Slash Commands の `トークン` の文字列を JSON 配列形式で設定します。  
  e.g. `export SLACK_TOKENS='[ "ADX82dDpEl0urNrOcAwqWXXXX" ]`  

- デプロイするステージを変更する  
  ステージは `dev`、`qas`、`prd` に対応しています。引数無しでデプロイした場合は `dev` になります。  
  変更する場合はデプロイ時に引数 `--stage qas` のように指定します。  
  e.g. `yarn deploy --stage qas`  

- デプロイするリージョンを変更する  
  `/serverless.js` の `custom.stages.region` から、変更する `stage` の値を変更します。  

- 画像ファイルの削除期間を変更する  
  設定は `resources.Resources.ImagesBucket.Properties.LifecycleConfiguration.Rules` です。  
  削除を無効にする場合、`Status: 'Disabled'` に設定します。  
  削除するまでの期間を変更する場合、`ExpirationInDays` の値を変更します。  

- 天気レポート表示のフッターにメッセージを表示する  
  環境変数 `NOTE` に表示したい文字列を設定します。`{project}` は、本リポジトリの URL を指す `[sora-agami <version>]` に置き換えられます。  
  デモ環境の `本デモは予期せず終了することがあります [sora-kagami 1.0.0]` が利用例になります。  


### 📦 CircleCI による CI/CD
ソースコードには [CircleCI](https://circleci.com/) の設定ファイルが含まれています。  
ご利用のソースコードを GitHub へアップし、CircleCI へ GitHub プロジェクトを追加します。  

CircleCI の [SETTINGS] - [Contexts] に、環境変数設定用のコンテキストを追加します。  
コンテキスト名 [NAME] は `sora-kagami` で、以下の環境変数を追加します。  
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- YOLP_APP_ID

以降、GitHub へコミットするたびに CircleCI がビルド＆デプロイを実行します。

デプロイするステージはブランチに応じて決まります。

| ブランチ名 | ステージ |
|:-----------|:---------|
| master     | dev      |
| stable     | qas      |
| production | prd      |


## ⚖ ライセンス
このリポジトリおよび成果物は Riots.works が著作権を有し、MIT ライセンスの元に配布されています。  
ライセンスの全文は、こちら [LICENSE](/LICENSE) をご参照ください。  

© [Riots.works](https://riotz.works/)  
