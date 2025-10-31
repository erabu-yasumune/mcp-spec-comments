import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  passToAIForRequirements,
  passToAIForDesign,
  passToAIForComments,
  passToAIForImplementation,
} from './tools.js';
import { clearConfigCache } from './config.js';

describe('tools', () => {
  const testDir = path.join(process.cwd(), '.test-tools');
  const templatesDir = path.join(testDir, 'templates', 'defaults');
  const requirementsTemplate = path.join(templatesDir, 'requirements.md');
  const designTemplate = path.join(templatesDir, 'design.md');
  const commentRulesFile = path.join(templatesDir, 'comment-rules.md');
  const implRulesFile = path.join(templatesDir, 'implementation-rules.md');

  beforeEach(async () => {
    clearConfigCache();
    await fs.mkdir(templatesDir, { recursive: true });

    // Create minimal template files
    await fs.writeFile(requirementsTemplate, '# Requirements Template\n[Template content]');
    await fs.writeFile(designTemplate, '# Design Template\n[Template content]');
    await fs.writeFile(commentRulesFile, '# Comment Rules\n[Rules content]');
    await fs.writeFile(implRulesFile, '# Implementation Rules\n[Rules content]');
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('passToAIForRequirements', () => {
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

  describe('passToAIForDesign', () => {
    const requirementsFile = path.join(testDir, 'requirements.md');

    beforeEach(async () => {
      await fs.writeFile(requirementsFile, '# Requirements\n- Login functionality');
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

      // Design rules should be loaded from default path
      expect(prompt).toContain('# ルール');
    });

    it('should include code writing constraints', async () => {
      const prompt = await passToAIForDesign({
        requirements_path: requirementsFile,
        feature_name: 'login',
      });

      expect(prompt).toContain('プログラミング言語の具体的なコード実装は書かないでください');
    });
  });

  describe('passToAIForComments', () => {
    const designFile = path.join(testDir, 'design.md');

    beforeEach(async () => {
      await fs.writeFile(designFile, '# Design\n## Components\n- LoginForm');
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

      // Comment rules should be loaded from default path
      expect(prompt).toContain('# コメントルール');
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

  describe('passToAIForImplementation', () => {
    const targetFile = path.join(testDir, 'login.ts');

    beforeEach(async () => {
      const fileContent = `// @spec-impl[状態:TODO][優先度:高][実装順序:1]
// Login implementation
// @spec-end`;
      await fs.writeFile(targetFile, fileContent);
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
});
