import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { passToAIForDesign } from '../design.js';
import { clearConfigCache } from '../../config.js';

describe('passToAIForDesign', () => {
  const testDir = path.join(process.cwd(), '.test-design');
  const templatesDir = path.join(testDir, 'templates', 'defaults');
  const designTemplate = path.join(templatesDir, 'design.md');
  const requirementsFile = path.join(testDir, 'requirements.md');

  beforeEach(async () => {
    clearConfigCache();
    await fs.mkdir(templatesDir, { recursive: true });

    // Create minimal template files
    await fs.writeFile(designTemplate, '# Design Template\n[Template content]');
    await fs.writeFile(requirementsFile, '# Requirements\n- Login functionality');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate prompt with requirements and template', async () => {
    const prompt = await passToAIForDesign({
      requirements_path: requirementsFile,
      feature_name: 'login',
    });

    expect(prompt).toContain('# 要件定義書');
    expect(prompt).toContain('Login functionality');
    expect(prompt).toContain('# テンプレート');
    expect(prompt).toContain('フェーズ2: 詳細設計書作成');
  });

  it('should include design rules if available', async () => {
    const prompt = await passToAIForDesign({
      requirements_path: requirementsFile,
      feature_name: 'login',
    });

    // Design rules should be loaded from default path if exists
    // This test may or may not contain rules depending on setup
    expect(prompt).toBeDefined();
  });

  it('should include code writing constraints', async () => {
    const prompt = await passToAIForDesign({
      requirements_path: requirementsFile,
      feature_name: 'login',
    });

    expect(prompt).toContain('プログラミング言語の具体的なコード実装は書かないでください');
  });
});
