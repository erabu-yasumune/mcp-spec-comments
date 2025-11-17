import { readMultipleFiles } from '../utils.js';

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
