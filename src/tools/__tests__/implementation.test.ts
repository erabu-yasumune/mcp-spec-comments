import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { passToAIForImplementation } from '../implementation.js';
import { clearConfigCache } from '../../config.js';

describe('passToAIForImplementation', () => {
  const testDir = path.join(process.cwd(), '.test-implementation');
  const templatesDir = path.join(testDir, 'templates', 'defaults');
  const commentRulesFile = path.join(templatesDir, 'comment-rules.md');
  const implRulesFile = path.join(templatesDir, 'implementation-rules.md');
  const targetFile = path.join(testDir, 'login.ts');

  beforeEach(async () => {
    clearConfigCache();
    await fs.mkdir(templatesDir, { recursive: true });

    // Create minimal template files
    await fs.writeFile(commentRulesFile, '# Comment Rules\n[Rules content]');
    await fs.writeFile(implRulesFile, '# Implementation Rules\n[Rules content]');

    // Create target file with spec markers
    const fileContent = `// @spec-impl[状態:TODO][優先度:高][実装順序:1]
// Login implementation
// @spec-end`;
    await fs.writeFile(targetFile, fileContent);
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate prompt with target files', async () => {
    const prompt = await passToAIForImplementation({
      target_files: [targetFile],
    });

    expect(prompt).toContain('# 実装対象ファイル');
    expect(prompt).toContain('login.ts');
    expect(prompt).toContain('@spec-impl');
    expect(prompt).toContain('フェーズ4: 実装処理');
  });

  it('should include comment rules if available', async () => {
    const prompt = await passToAIForImplementation({
      target_files: [targetFile],
    });

    expect(prompt).toContain('# コメントルール');
  });

  it('should include implementation rules if available', async () => {
    const prompt = await passToAIForImplementation({
      target_files: [targetFile],
    });

    expect(prompt).toContain('# 実装ルール');
  });

  it('should include implementation order if specified', async () => {
    const prompt = await passToAIForImplementation({
      target_files: [targetFile],
      implementation_order: 3,
    });

    expect(prompt).toContain('実装順序: 3番目');
  });
});
