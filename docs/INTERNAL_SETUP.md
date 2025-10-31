# 社内利用セットアップガイド

## インストール方法

### 1. リポジトリをクローン

```bash
# 社内Gitリポジトリからクローン
git clone <your-internal-repo-url> ~/mcp-spec-comments
cd ~/mcp-spec-comments
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. ビルド

```bash
npm run build
```

### 4. Claude CLI に設定


```bash
claude mcp add spec-comments -- node ~/mcp-spec-comments/dist/index.js
```

**注意**: パスは各自の環境に合わせて変更してください。

### 5. Claude CLI を再起動

設定を反映させるために Claude CLI を再起動します。

---

## 使い方

### プロジェクトで使用する

1. プロジェクトルートに `config.yml` を作成:

```yaml
templates:
  directory: "./templates"
  use_defaults: true

rules:
  comment_rules: "./rules/comment-rules.md"
  implementation_rules: "./rules/implementation-rules.md"

project:
  root: "."
  source: "./src"
```

2. Claude に以下のように依頼:

**ステップ1: 要件定義書作成**
```
pass_to_ai_for_requirements ツールを使って、
ユーザー入力: ユーザー認証機能を持つWebアプリを作りたい
出力先: docs/requirements.md
```

**ステップ2: 設計書作成**
```
pass_to_ai_for_design ツールを使って、
要件定義書: docs/requirements.md
出力先: docs/design.md
```

**ステップ3: コメント配置**
```
pass_to_ai_for_comments ツールを使って、
設計書: docs/design.md
```

**ステップ4: 実装**
```
pass_to_ai_for_implementation ツールで、
対象ファイル: ["src/auth.ts"]
```

---


## 更新方法

```bash
cd ~/mcp-spec-comments
git pull
npm install
npm run build
# Claude を再起動
```
