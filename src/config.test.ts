import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { loadConfig, clearConfigCache } from './config.js';

describe('config', () => {
  const testConfigPath = path.join(process.cwd(), 'test-config.yml');

  beforeEach(() => {
    clearConfigCache();
  });

  afterEach(async () => {
    // Clean up test config file if exists
    try {
      await fs.unlink(testConfigPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('loadConfig', () => {
    it('should load default configuration when no config file exists', async () => {
      const config = await loadConfig('non-existent-config.yml');

      expect(config.templates.directory).toBe('./templates');
      expect(config.templates.use_defaults).toBe(true);
      expect(config.output.base_directory).toBe('./.spec-comments');
      expect(config.project.root).toBe('.');
      expect(config.project.source).toBe('./src');
    });

    it('should have default rules paths pointing to templates/defaults/', async () => {
      const config = await loadConfig('non-existent-config.yml');

      expect(config.rules.comment_rules).toContain('templates');
      expect(config.rules.comment_rules).toContain('defaults');
      expect(config.rules.comment_rules).toContain('comment-rules.md');

      expect(config.rules.design_rules).toContain('templates');
      expect(config.rules.design_rules).toContain('defaults');
      expect(config.rules.design_rules).toContain('design.md');

      expect(config.rules.implementation_rules).toContain('templates');
      expect(config.rules.implementation_rules).toContain('defaults');
      expect(config.rules.implementation_rules).toContain('implementation-rules.md');
    });

    it('should merge custom config with defaults', async () => {
      const customConfig = `
templates:
  directory: ./custom-templates
rules:
  comment_rules: ./custom-comment-rules.md
output:
  base_directory: ./custom-output
`;
      await fs.writeFile(testConfigPath, customConfig);

      const config = await loadConfig(testConfigPath);

      expect(config.templates.directory).toBe('./custom-templates');
      expect(config.templates.use_defaults).toBe(true); // Should keep default value
      expect(config.rules.comment_rules).toBe('./custom-comment-rules.md');
      expect(config.output.base_directory).toBe('./custom-output');
      expect(config.output.requirements_filename).toBe('requirements.md'); // Should keep default
    });

    it('should override default rules when specified in config', async () => {
      const customConfig = `
rules:
  comment_rules: ./my-custom-rules.md
  design_rules: ./my-design-rules.md
`;
      await fs.writeFile(testConfigPath, customConfig);

      const config = await loadConfig(testConfigPath);

      expect(config.rules.comment_rules).toBe('./my-custom-rules.md');
      expect(config.rules.design_rules).toBe('./my-design-rules.md');
      // implementation_rules should still use default
      expect(config.rules.implementation_rules).toContain('defaults');
    });

    it('should cache configuration after first load', async () => {
      const config1 = await loadConfig('non-existent-config.yml');
      const config2 = await loadConfig('non-existent-config.yml');

      expect(config1).toBe(config2); // Same object reference (cached)
    });

    it('should reload configuration after cache is cleared', async () => {
      const config1 = await loadConfig('non-existent-config.yml');
      clearConfigCache();
      const config2 = await loadConfig('non-existent-config.yml');

      expect(config1).not.toBe(config2); // Different object references
      expect(config1).toEqual(config2); // But same values
    });
  });
});
