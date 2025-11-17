import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { passToAIForRequirements } from '../requirements.js';
import { clearConfigCache } from '../../config.js';

describe('passToAIForRequirements', () => {
  const testDir = path.join(process.cwd(), '.test-requirements');
  const templatesDir = path.join(testDir, 'templates', 'defaults');
  const requirementsTemplate = path.join(templatesDir, 'requirements.md');

  beforeEach(async () => {
    clearConfigCache();
    await fs.mkdir(templatesDir, { recursive: true });

    // Create minimal template file
    await fs.writeFile(requirementsTemplate, '# Requirements Template\n[Template content]');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should generate prompt with user input and template', async () => {
    const prompt = await passToAIForRequirements({
      user_input: 'Create a login feature',
      feature_name: 'login',
    });

    expect(prompt).toContain('# テンプレート');
    expect(prompt).toContain('# ユーザー要件');
    expect(prompt).toContain('Create a login feature');
    expect(prompt).toContain('フェーズ1: 要件定義書作成');
  });

  it('should include output path in prompt', async () => {
    const prompt = await passToAIForRequirements({
      user_input: 'Create a login feature',
      feature_name: 'login',
      output_path: './custom/output.md',
    });

    expect(prompt).toContain('./custom/output.md');
  });

  it('should generate default output path if not provided', async () => {
    const prompt = await passToAIForRequirements({
      user_input: 'Create a login feature',
      feature_name: 'login',
    });

    expect(prompt).toContain('.spec-comments/login/requirements.md');
  });
});
