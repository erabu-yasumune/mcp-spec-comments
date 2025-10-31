# mcp-spec-comments

**MCP server for spec-driven development with comment-based implementation**

シンプルなコメントベースの設計駆動開発を支援するMCPサーバーです。AIとファイルの間でテンプレートやルールを橋渡しし、設計書の作成からコメント配置、実装までをサポートします。

## 特徴

- 🎯 **シンプル設計**: MCPサーバーはファイルの読み書きに徹し、複雑な処理はAIに委譲
- 📝 **コメント駆動**: `@spec-impl` マーカーで実装箇所と手順を明確化
- 🔄 **ワークフロー管理**: 設計書作成 → コメント配置 → 実装 → 進捗確認の流れをサポート
- ⚙️ **カスタマイズ可能**: テンプレートとルールをプロジェクトに合わせてカスタマイズ

## ステータス

⚠️ **現在はローカル利用のみ対応**

このプロジェクトは現在、npm パッケージとしての公開は行っていません。
ローカル環境または社内 Git リポジトリでの利用を想定しています。

## インストール

### ローカル利用の場合

1. リポジトリをクローン:
```bash
git clone <repository-url> ~/mcp-spec-comments
cd ~/mcp-spec-comments
```

2. 依存関係をインストール:
```bash
npm install
```

3. ビルド:
```bash
npm run build
```

### 社内共有の場合

詳細は [社内利用セットアップガイド](./docs/INTERNAL_SETUP.md) を参照してください。

## セットアップ

### 1. spec-comments.config.yml を作成
プロジェクト固有の設定を反映したい場合は作成してください。もし作成しなかった場合、**デフォルトの設定**が反映されます。  
プロジェクトルートに `spec-comments.config.yml` を作成します:

```yaml
# テンプレート設定
templates:
  directory: "./templates"  # カスタムテンプレートの場所
  use_defaults: true        # デフォルトテンプレートを使用

# ルールファイル（任意）
rules:
  design_rules: "./rules/design-rules.md"
  comment_rules: "./rules/comment-rules.md"
  implementation_rules: "./rules/implementation-rules.md"

# 出力先のデフォルト設定
output:
  base_directory: "./.spec-comments"
  requirements_filename: "requirements.md"
  design_filename: "design.md"
  implementation_log_filename: "implementation.log"

# プロジェクト設定
project:
  root: "."
  source: "./src"
```

### 2. Claude に設定

#### 方法A: Claude CLI から登録（推奨）

```bash
claude mcp add spec-comments -- node /path/to/mcp-spec-comments/dist/index.js
```

**注意**: `/path/to/mcp-spec-comments` は実際のインストールパスに置き換えてください。

#### 方法B: 手動で設定ファイルを編集

`claude_desktop_config.json` を編集:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "spec-comments": {
      "command": "node",
      "args": [
        "/path/to/mcp-spec-comments/dist/index.js"
      ],
      "cwd": "/path/to/mcp-spec-comments"
    }
  }
}
```

**注意**: `/path/to/mcp-spec-comments` は実際のインストールパスに置き換えてください。

### 3. Claude を再起動

設定を反映させるため、Claude を再起動してください。

## 使い方

### ワークフロー

このMCPサーバーは、**フェーズごとのユーザー確認**を重視した段階的なワークフローを採用しています。

```
フェーズ1: 要件定義書作成
   pass_to_ai_for_requirements でユーザー要件から要件定義書を生成
   ↓
   ✅ ユーザー確認・承認
   ↓
フェーズ2: 詳細設計書作成
   pass_to_ai_for_design で要件定義書から設計書を生成
   ↓
   ✅ ユーザー確認・承認
   ↓
フェーズ3: コメント配置
   pass_to_ai_for_comments で設計書からコメントを配置
   ↓
   ✅ ユーザー確認・承認
   ↓
フェーズ4: 実装処理
   pass_to_ai_for_implementation でコメントに従って実装
   ↓
   ✅ 完了
```

**重要**: 各フェーズ完了後、必ずユーザーの承認を得てから次のフェーズに進みます。

### ツール一覧

#### 1. `pass_to_ai_for_requirements`

ユーザー要件をAIに渡して要件定義書を作成（ワークフローの最初のステップ）。

**パラメータ**:
- `user_input` (必須): ユーザーの要件や作りたいものの説明
- `feature_name` (必須): 機能名（例: `user-authentication`, `payment-system`）
- `output_path` (任意): 出力先のファイルパス（デフォルト: `.spec-comments/{feature_name}/requirements.md`）

**例**:
```
ユーザー入力: ユーザー認証機能を持つWebアプリケーション
機能名: user-authentication
出力先: .spec-comments/user-authentication/requirements.md (自動生成)
```

#### 2. `pass_to_ai_for_design`

要件定義書を元にAIに設計書を作成させる（ワークフローの2番目のステップ）。

**パラメータ**:
- `requirements_path` (必須): 要件定義書のファイルパス
- `feature_name` (必須): 機能名（要件定義書作成時と同じ名前を指定）
- `output_path` (任意): 出力先のファイルパス（デフォルト: `.spec-comments/{feature_name}/design.md`）

**例**:
```
要件定義書: .spec-comments/user-authentication/requirements.md
機能名: user-authentication
出力先: .spec-comments/user-authentication/design.md (自動生成)
```

#### 3. `pass_to_ai_for_comments`

設計書を元にAIにコメント(`@spec-impl`マーカー)を配置させる（ワークフローの3番目のステップ）。

**パラメータ**:
- `design_path` (必須): 設計書のファイルパス
- `target_files` (任意): コメントを配置する対象ファイルのパス配列

**例**:
```
設計書: docs/design.md
対象ファイル: ["src/auth.ts", "src/user.ts"]
```

#### 4. `pass_to_ai_for_implementation`

コメント付きファイルをAIに渡して実装させる（ワークフローの最後のステップ）。

**パラメータ**:
- `target_files` (必須): 実装対象のファイルパス配列
- `implementation_order` (任意): 実装順序

**例**:
```
対象ファイル: ["src/auth.ts"]
```

## コメントマーカー形式

```typescript
// @spec-impl [ID] [優先度] [状態]
// [実装内容の説明]
// [実装手順を箇条書きで記述]
// @spec-end
```

**例**:
```typescript
// @spec-impl AUTH-001 HIGH TODO
// ユーザー認証処理を実装
// 1. リクエストからAuthorizationヘッダーを取得
// 2. トークンの検証(JWTライブラリ使用)
// 3. トークンが無効な場合は401エラーを返す
// 4. 有効な場合はユーザー情報をデコードして返却
// @spec-end
```

実装後:
```typescript
// @spec-impl AUTH-001 HIGH DONE
// ユーザー認証処理を実装
export function authenticateUser(token: string): User | null {
  // 実装されたコード
}
// @spec-end
```

## デフォルトテンプレート

パッケージには以下のデフォルトテンプレートが含まれています:

### `requirements.md` - 要件定義書テンプレート
包括的な要件定義書テンプレートで、小規模から大規模プロジェクトまで対応可能です。

**主な特徴**:
- ユーザーストーリー形式（As a/I want/so that）
- WHEN/THEN形式の受け入れ基準
- 優先度・依存関係の管理
- 詳細な非機能要件（コードアーキテクチャ、パフォーマンス、セキュリティ、信頼性、スケーラビリティ、ユーザビリティ、保守性）
- リスク管理と成功基準
- スケジュールとマイルストーン
- 承認フローと改訂履歴

**含まれるセクション**:
- プロジェクト概要とビジョンとの整合性
- ステークホルダー情報
- 機能要件（優先度・依存関係付き）
- 非機能要件（詳細）
- 技術制約とスコープ
- 前提条件と依存関係
- 用語集
- リスクと対策
- 成功基準
- スケジュールとマイルストーン
- 承認フローと改訂履歴

### その他のテンプレート

- `design.md`: 詳細設計書テンプレート
- `comment-rules.md`: コメント記述ルール
- `implementation-rules.md`: 実装ルール

これらは `spec-comments.config.yml` で `use_defaults: true` にすることで使用できます。

## ディレクトリ構造

このMCPサーバーは、機能ごとにドキュメントを整理する構造を採用しています:

```
your-project/
├── .spec-comments/              # 機能別ドキュメントの基底ディレクトリ
│   ├── user-authentication/     # 機能1: ユーザー認証
│   │   ├── requirements.md      # 要件定義書
│   │   └── design.md            # 詳細設計書
│   ├── payment-system/          # 機能2: 決済システム
│   │   ├── requirements.md
│   │   └── design.md
│   └── dashboard-ui/            # 機能3: ダッシュボードUI
│       ├── requirements.md
│       └── design.md
├── src/                         # 実装コード
├── templates/                   # カスタムテンプレート（任意）
│   ├── requirements.md
│   └── design.md
└── spec-comments.config.yml     # 設定ファイル
```

**ポイント**:
- 機能名（`feature_name`）は各ツール実行時に指定
- `.spec-comments/{feature_name}/` 配下にドキュメントが自動配置される
- 出力先をカスタマイズしたい場合は `output_path` パラメータで上書き可能

## カスタマイズ

### テンプレートのカスタマイズ

プロジェクトの `templates/` ディレクトリにカスタムテンプレートを配置できます:

```
your-project/
├── templates/
│   ├── requirements.md      # カスタム要件定義テンプレート
│   ├── design.md            # カスタム設計書テンプレート
│   └── my-custom.md         # 独自テンプレート
└── spec-comments.config.yml
```

### 出力先のカスタマイズ

`spec-comments.config.yml` で基底ディレクトリやファイル名を変更できます:

```yaml
output:
  base_directory: "./docs/features"  # 基底ディレクトリを変更
  requirements_filename: "spec.md"   # ファイル名を変更
  design_filename: "architecture.md"
```

## 将来的な機能

### 実装状況管理機能（未実装）

現在、`@spec-impl` マーカーの状態管理は手動で行う必要がありますが、将来的には以下の機能を追加予定です:

- **実装状況の自動スキャン**: プロジェクト内の `@spec-impl` マーカーをスキャンして一覧表示
- **進捗レポート**: TODO/IN_PROGRESS/DONE の状態別に集計
- **実装順序の管理**: `[実装順序:数値]` に基づいて次に実装すべき項目を提案
- **優先度フィルタリング**: 優先度別の絞り込み表示

この機能が実装されるまでは、エディタの検索機能（`@spec-impl[状態:TODO]` など）で手動管理してください。

## ライセンス

MIT

## 作者

yerabu
