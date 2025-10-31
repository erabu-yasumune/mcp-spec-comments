import * as path from 'path';
import { loadConfig, Config } from './config.js';
import {
  readFile,
  readFileIfExists,

  readMultipleFiles,
} from './utils.js';

// Helper function to generate output path based on feature name
function generateOutputPath(
  config: Config,
  featureName: string,
  filename: string
): string {
  return path.join(config.output.base_directory, featureName, filename);
}

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

// Tool 4: verify_spec_comments
export interface VerifySpecCommentsInput {
  target_files: string[];
}

export interface VerifySpecCommentsResult {
  status: 'complete' | 'incomplete';
  files: Array<{
    path: string;
    has_spec_marker: boolean;
    marker_count: number;
  }>;
  message: string;
}

export async function verifySpecComments(
  input: VerifySpecCommentsInput
): Promise<VerifySpecCommentsResult> {
  const files = await readMultipleFiles(input.target_files);

  const verification = files.map((file) => {
    const hasMarker = /@spec-impl/.test(file.content);
    const markerCount = (file.content.match(/@spec-impl/g) || []).length;

    return {
      path: file.path,
      has_spec_marker: hasMarker,
      marker_count: markerCount,
    };
  });

  const allComplete = verification.every((v) => v.has_spec_marker);
  const incompleteFiles = verification.filter((v) => !v.has_spec_marker);

  return {
    status: allComplete ? 'complete' : 'incomplete',
    files: verification,
    message: allComplete
      ? '✅ すべてのファイルに@spec-implマーカーが配置されています'
      : `⚠️ ${incompleteFiles.length}個のファイルにマーカーが未配置です:\n${incompleteFiles.map((f) => `  - ${f.path}`).join('\n')}`,
  };
}

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
