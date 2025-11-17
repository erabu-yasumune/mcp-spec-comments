# Tools Directory

MCPツールの実装ディレクトリ

## 基本ルール

### 1ファイル1ツール
- 1つのツールは1つのファイルに実装
- ファイル名はツールの機能を表す（例: `requirements.ts`, `design.ts`）

### テストは必須
- すべてのツールに対してテストを作成
- テストは `__tests__/` ディレクトリに配置
- ファイル名: `{ツール名}.test.ts`

## ディレクトリ構成

```
src/tools/
├── index.ts              # すべてのツールをエクスポート
├── requirements.ts       # 要件定義書作成ツール
├── design.ts             # 設計書作成ツール
├── comments.ts           # コメント配置ツール
├── verify.ts             # 検証ツール
├── implementation.ts     # 実装処理ツール
└── __tests__/            # テストファイル
    ├── requirements.test.ts
    ├── design.test.ts
    ├── comments.test.ts
    ├── verify.test.ts
    └── implementation.test.ts
```

## 新しいツールの追加

1. `src/tools/{tool-name}.ts` を作成
2. `src/tools/__tests__/{tool-name}.test.ts` を作成
3. `src/tools/index.ts` にエクスポート追加
4. `src/index.ts` でMCPサーバーに登録
5. `npm test` で確認

## 参考

既存のツール実装を参考にしてください。

共通機能は `../utils.ts` を使用：
- `readFile`, `writeFile`, `generateOutputPath` など
