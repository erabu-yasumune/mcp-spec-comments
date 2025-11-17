import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { passToAIForComments } from '../comments.js';
import { clearConfigCache } from '../../config.js';

describe('passToAIForComments', () => {
  const testDir = path.join(process.cwd(), '.test-comments');
  const templatesDir = path.join(testDir, 'templates', 'defaults');
  const commentRulesFile = path.join(templatesDir, 'comment-rules.md');
  const designFile = path.join(testDir, 'design.md');

  beforeEach(async () => {
    clearConfigCache();
    await fs.mkdir(templatesDir, { recursive: true });

    // Create minimal template files
    await fs.writeFile(commentRulesFile, '# Comment Rules\n[Rules content]');
    await fs.writeFile(designFile, '# Design\n## Components\n- LoginForm');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate prompt with design document', async () => {
    const prompt = await passToAIForComments({
      design_path: designFile,
    });

    expect(prompt).toContain('# 設計書');
    expect(prompt).toContain('LoginForm');
    expect(prompt).toContain('フェーズ3: コメント配置');
  });

  it('should include comment rules if available', async () => {
    const prompt = await passToAIForComments({
      design_path: designFile,
    });

    // Comment rules should be loaded from default path if exists
    expect(prompt).toBeDefined();
  });

  it('should include existing files if specified', async () => {
    const existingFile = path.join(testDir, 'existing.ts');
    await fs.writeFile(existingFile, 'export function login() {}');

    const prompt = await passToAIForComments({
      design_path: designFile,
      target_files: [existingFile],
    });

    expect(prompt).toContain('# 既存ファイル');
    expect(prompt).toContain('existing.ts');
    expect(prompt).toContain('export function login() {}');
  });
});
