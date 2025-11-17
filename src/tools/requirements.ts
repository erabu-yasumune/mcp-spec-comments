import * as path from 'path';
import { loadConfig } from '../config.js';
import { readFile, readFileIfExists, generateOutputPath } from '../utils.js';

// Tool 1: pass_to_ai_for_requirements
export interface PassToAIForRequirementsInput {
  user_input: string;
  feature_name: string;
  output_path?: string;
}

export async function passToAIForRequirements(
  input: PassToAIForRequirementsInput
): Promise<string> {
  const config = await loadConfig();

  // Generate output path if not provided
  const outputPath =
    input.output_path ||
    generateOutputPath(
      config,
      input.feature_name,
      config.output.requirements_filename
    );

  // 1. Load requirements template
  let templateContent: string;
  const defaultTemplatePath = path.join(
    __dirname,
    '..',
    '..',
    'templates',
    'defaults',
    'requirements.md'
  );
  const customTemplatePath = path.join(
    config.templates.directory,
    'requirements.md'
  );

  // Try custom template first, fallback to default
  const customTemplate = await readFileIfExists(customTemplatePath);
  if (customTemplate) {
    templateContent = customTemplate;
  } else if (config.templates.use_defaults) {
    templateContent = await readFile(defaultTemplatePath);
  } else {
    throw new Error('Requirements template not found');
  }

  // 2. Construct prompt for AI
  const prompt = `# テンプレート
${templateContent}

# ユーザー要件
${input.user_input}

上記のテンプレートを基に、ユーザー要件を反映した完全な要件定義書を作成してください。

**重要な指示**:
1. テンプレートは構造と形式の参考として使用し、**実際の内容はユーザー要件に基づいて具体的に記述してください**
2. テンプレート内にプレースホルダー(例: [項目名]、[説明]など)がある場合は、それらを実際の内容で置き換えてください
3. テンプレート内に例示がある場合は参考にしつつ、ユーザー要件に合わせた独自の内容を作成してください
4. **テンプレートをそのままコピーするのではなく**、ユーザー要件の内容を具体的に展開した完成版の要件定義書を作成してください
5. すべてのセクションに対して、ユーザー要件から導き出せる具体的な内容を記述してください

**📁 ファイル保存の手順**:
1. **必須**: Write ツールを使用して、作成した要件定義書を **${outputPath}** に保存してください
2. 保存する際は、**絶対パス**または**プロジェクトルートからの相対パス**を使用してください
3. ディレクトリが存在しない場合は、Bash ツールで \`mkdir -p\` を使用してディレクトリを作成してから保存してください
   例: \`mkdir -p "$(dirname "${outputPath}")"\`
4. 保存完了後、「✅ 要件定義書を ${outputPath} に保存しました」と報告してください

**📌 ワークフロー管理の重要な指示**:
- このツールは「フェーズ1: 要件定義書作成」です
- 要件定義書作成完了後、**必ずユーザーに内容を確認してもらい、承認を得てください**
- ユーザーの承認なしに次のフェーズ（詳細設計書作成）へ進んではいけません
- 確認を求める際は、作成した要件定義書の要点を簡潔に説明し、「この内容で問題なければ、次のフェーズ（詳細設計書作成）に進みます」と明示してください`;

  return prompt;
}
