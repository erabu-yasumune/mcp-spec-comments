import { loadConfig } from '../config.js';
import { readFile, readFileIfExists, readMultipleFiles } from '../utils.js';

// Tool 3: pass_to_ai_for_comments
export interface PassToAIForCommentsInput {
  design_path: string;
  target_files?: string[];
}

export async function passToAIForComments(
  input: PassToAIForCommentsInput
): Promise<string> {
  const config = await loadConfig();

  // 1. Read design document
  const design = await readFile(input.design_path);

  // 2. Load comment rules (optional)
  const commentRules = config.rules.comment_rules
    ? await readFileIfExists(config.rules.comment_rules)
    : null;

  // 3. Read target files if specified
  let existingFilesSection = '';
  if (input.target_files && input.target_files.length > 0) {
    const files = await readMultipleFiles(input.target_files);
    existingFilesSection = `\n# 既存ファイル\n${files
      .map(
        (f) => `## ${f.path}
\`\`\`
${f.content}
\`\`\``
      )
      .join('\n')}\n`;
  }

  // 4. Construct prompt for AI
  const prompt = `# 設計書
${design}

${commentRules ? `# コメントルール\n${commentRules}\n` : ''}${existingFilesSection}

**📌 フェーズ3: コメント配置 - 実行必須タスク**

このツールは単なる「指示の提示」ではありません。以下の手順を**必ず実行**してください:

**🔍 実装構造の理解（コメント配置前の必須確認）**:
1. **CLAUDE.md/AGENTS.mdの確認**:
   - target_filesと**同じディレクトリ**を最優先で確認（見つからない場合は親ディレクトリを遡る）
   - 確認方法: Bash \`test -f "$(dirname "ファイルパス")/CLAUDE.md"\` または Read で直接試行
   - **CLAUDE.md**: ファイル構成、命名規則、コメント記述ルール、プロジェクト固有ルールを理解
   - **AGENTS.md**（エージェント/ワークフローシステムの場合）: 役割・責務、連携方法、制約条件、エージェント固有のコメント規則を理解

2. **既存ファイルのパターン確認**:
   - target_files読み込み済みの場合、コメント配置位置・インデントスタイル・コメントフォーマットを確認
   - 既存パターンに従い、ディレクトリルールとインデント/フォーマットを維持してコメント配置

**ステップ1: ファイルへのコメント追加/作成**
${
  input.target_files && input.target_files.length > 0
    ? `
1. **既存ファイルへのコメント追加** (target_filesが指定されています):
   - 以下の各ファイルに対して、**Editツール**を使って@spec-implマーカーを追加してください:
${input.target_files.map((f) => `     - ${f}`).join('\n')}
   - マーカーは適切な位置（関数・コンポーネント定義の直前、またはファイルの先頭）に配置
   - 各ファイルへの追加が完了するまで次のステップに進まないでください
`
    : `
1. **既存ファイルへのコメント追加** (target_filesは指定されていません):
   - 設計書で言及されている既存ファイルがあれば、**Editツール**で@spec-implマーカーを追加
`
}
2. **新規ファイルの作成** (設計書で新規ファイルが必要な場合):
   - **Writeツール**を使って新規ファイルを作成
   - 作成時に@spec-implマーカーを含めて作成してください

**ステップ2: 検証の実行**
- すべてのファイルへの追加/作成が完了したら、**verify_spec_commentsツール**を実行してください
${
  input.target_files && input.target_files.length > 0
    ? `  - target_files: ${JSON.stringify(input.target_files)}`
    : '  - target_files: [作成/編集したすべてのファイルのパス]'
}
- 検証結果が **status: "incomplete"** の場合:
  - 未追加のファイルを特定
  - 再度Editツールで@spec-implマーカーを追加
  - 検証を再実行
  - 最大3回まで自動修正を試行してください

**ステップ3: ユーザー報告**
- 検証結果が **status: "complete"** になったら:
  - 追加/作成したファイルの一覧を報告
  - 各ファイルに追加したマーカーの数を報告
  - 「✅ フェーズ3が完了しました。次のフェーズ（実装処理）に進みますか?」と確認してください

**⚠️ 重要な注意事項**:
- このツールは「プロンプトを返すだけ」ではありません
- **必ず実際にファイル編集（EditまたはWrite）を実行してください**
- 検証ツール（verify_spec_comments）で確認が取れるまで完了とみなしません
- ユーザーの承認なしに次のフェーズ（実装処理）に進んではいけません

**⚠️ ユーザーから修正依頼があった場合の対応**:
- ユーザーの承認前に修正依頼があった場合は、**実装を行わずにコメントの修正・追加のみを行ってください**
- コメントルールに従って @spec-impl マーカーを適切に修正・追加してください
- 修正完了後、再度verify_spec_commentsツールで検証してください
- 修正完了後、再度ユーザーに確認を求めてください
- **実装フェーズ（フェーズ4）に進むのは、ユーザーが明示的に承認した後のみです**`;

  return prompt;
}
