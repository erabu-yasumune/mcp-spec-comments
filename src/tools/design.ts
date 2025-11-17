import * as path from 'path';
import { loadConfig } from '../config.js';
import { readFile, readFileIfExists, generateOutputPath } from '../utils.js';

// Tool 2: pass_to_ai_for_design
export interface PassToAIForDesignInput {
  requirements_path: string;
  feature_name: string;
  output_path?: string;
}

export async function passToAIForDesign(
  input: PassToAIForDesignInput
): Promise<string> {
  const config = await loadConfig();

  // Generate output path if not provided
  const outputPath =
    input.output_path ||
    generateOutputPath(
      config,
      input.feature_name,
      config.output.design_filename
    );

  // 1. Read requirements document
  const requirements = await readFile(input.requirements_path);

  // 2. Load design template
  let templateContent: string;
  const defaultTemplatePath = path.join(
    __dirname,
    '..',
    '..',
    'templates',
    'defaults',
    'design.md'
  );
  const customTemplatePath = path.join(
    config.templates.directory,
    'design.md'
  );

  // Try custom template first, fallback to default
  const customTemplate = await readFileIfExists(customTemplatePath);
  if (customTemplate) {
    templateContent = customTemplate;
  } else if (config.templates.use_defaults) {
    templateContent = await readFile(defaultTemplatePath);
  } else {
    throw new Error('Design template not found');
  }

  // 3. Load design rules (optional)
  const designRules = config.rules.design_rules
    ? await readFileIfExists(config.rules.design_rules)
    : null;

  // 4. Construct prompt for AI
  const prompt = `# 要件定義書
${requirements}

# テンプレート
${templateContent}

${designRules ? `# ルール\n${designRules}\n` : ''}
上記の要件定義書を元に、テンプレートを基にした完全な設計書を作成してください。

**重要な指示**:
1. テンプレートは構造と形式の参考として使用し、**実際の内容は要件定義書に基づいて具体的に記述してください**
2. テンプレート内にプレースホルダー(例: [コンポーネント名]、[説明]など)がある場合は、それらを要件に基づいた実際の内容で置き換えてください
3. 要件定義書に記載されている機能要件、非機能要件、技術制約などを反映した具体的な設計を記述してください
4. **テンプレートをそのままコピーするのではなく**、要件定義書の内容を具体的に設計として展開した完成版の設計書を作成してください
5. Mermaid図、データモデル定義、アーキテクチャ図などは要件に合わせた具体的な内容を作成してください

**コード記述に関する重要な制約**:
- **プログラミング言語の具体的なコード実装は書かないでください**
- コード例が必要な場合は、擬似コード、コメント、または説明文のみで表現してください
- 実装の詳細は後続の「コメント配置」「実装」フェーズで行うため、設計書では**何を実装するか**を明確にすることに集中してください
- インターフェース定義や型定義は、形式的な記述として許容されますが、具体的なロジック実装は含めないでください
- 例: ❌ \`const result = await prisma.user.findMany()\` → ⭕ \`ユーザー一覧を取得する処理\` または \`// ユーザー一覧を取得\`

**📁 ファイル保存の手順**:
1. **必須**: Write ツールを使用して、作成した設計書を **${outputPath}** に保存してください
2. 保存する際は、**絶対パス**または**プロジェクトルートからの相対パス**を使用してください
3. ディレクトリが存在しない場合は、Bash ツールで \`mkdir -p\` を使用してディレクトリを作成してから保存してください
   例: \`mkdir -p "$(dirname "${outputPath}")"\`
4. 保存完了後、「✅ 設計書を ${outputPath} に保存しました」と報告してください

**📌 ワークフロー管理の重要な指示**:
- このツールは「フェーズ2: 詳細設計書作成」です
- 詳細設計書作成完了後、**必ずユーザーに内容を確認してもらい、承認を得てください**
- ユーザーの承認なしに次のフェーズ（コメント追加）へ進んではいけません
- 確認を求める際は、作成した設計書の要点を簡潔に説明し、「この内容で問題なければ、次のフェーズ（コメント追加）に進みます」と明示してください`;

  return prompt;
}
