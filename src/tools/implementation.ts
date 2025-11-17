import { loadConfig } from '../config.js';
import { readFileIfExists, readMultipleFiles } from '../utils.js';

// Tool 5: pass_to_ai_for_implementation
export interface PassToAIForImplementationInput {
  target_files: string[];
  implementation_order?: number;
}

export async function passToAIForImplementation(
  input: PassToAIForImplementationInput
): Promise<string> {
  const config = await loadConfig();

  // 1. Read target files (with comments)
  const files = await readMultipleFiles(input.target_files);

  // 2. Load comment rules (optional)
  const commentRules = config.rules.comment_rules
    ? await readFileIfExists(config.rules.comment_rules)
    : null;

  // 3. Load implementation rules (optional)
  const implRules = config.rules.implementation_rules
    ? await readFileIfExists(config.rules.implementation_rules)
    : null;

  // 4. Construct prompt for AI
  const prompt = `${commentRules ? `# コメントルール\n${commentRules}\n\n` : ''}${
    implRules ? `# 実装ルール\n${implRules}\n\n` : ''
  }# 実装対象ファイル
${files
  .map(
    (f) => `## ${f.path}
\`\`\`
${f.content}
\`\`\``
  )
  .join('\n\n')}

上記のコメントに従って実装してください。
@spec-impl マーカーがある箇所を実装し、完了後はDONE状態に更新してください。
${input.implementation_order ? `実装順序: ${input.implementation_order}番目` : ''}

**📌 ワークフロー管理の重要な指示**:
- このツールは「フェーズ4: 実装処理」です（最終フェーズ）
- 実装完了後、実装内容の概要を簡潔に説明してください
- すべての@spec-implマーカーがDONE状態に更新されたことを確認してください`;

  return prompt;
}
