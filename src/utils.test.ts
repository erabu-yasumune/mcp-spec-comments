import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  readFile,
  writeFile,
  fileExists,
  readFileIfExists,
  scanDirectory,
  getLineNumber,
  readMultipleFiles,
} from './utils.js';

describe('utils', () => {
  const testDir = path.join(process.cwd(), '.test-utils');
  const testFile = path.join(testDir, 'test.txt');
  const nestedFile = path.join(testDir, 'nested', 'file.txt');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('readFile', () => {
    it('should read file content', async () => {
      await fs.writeFile(testFile, 'test content');
      const content = await readFile(testFile);
      expect(content).toBe('test content');
    });

    it('should throw error for non-existent file', async () => {
      await expect(readFile('non-existent.txt')).rejects.toThrow();
    });
  });

  describe('writeFile', () => {
    it('should write content to file', async () => {
      await writeFile(testFile, 'hello world');
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('hello world');
    });

    it('should create directories if they do not exist', async () => {
      await writeFile(nestedFile, 'nested content');
      const content = await fs.readFile(nestedFile, 'utf-8');
      expect(content).toBe('nested content');
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      await fs.writeFile(testFile, 'test');
      const exists = await fileExists(testFile);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const exists = await fileExists('non-existent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('readFileIfExists', () => {
    it('should read file if it exists', async () => {
      await fs.writeFile(testFile, 'test content');
      const content = await readFileIfExists(testFile);
      expect(content).toBe('test content');
    });

    it('should return null if file does not exist', async () => {
      const content = await readFileIfExists('non-existent.txt');
      expect(content).toBeNull();
    });
  });

  describe('scanDirectory', () => {
    beforeEach(async () => {
      await fs.mkdir(path.join(testDir, 'subdir'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'file1.ts'), '');
      await fs.writeFile(path.join(testDir, 'file2.js'), '');
      await fs.writeFile(path.join(testDir, 'file3.md'), '');
      await fs.writeFile(path.join(testDir, 'subdir', 'file4.ts'), '');
    });

    it('should scan all files in directory', async () => {
      const files = await scanDirectory(testDir);
      expect(files).toHaveLength(4);
    });

    it('should filter files by extension', async () => {
      const tsFiles = await scanDirectory(testDir, ['.ts']);
      expect(tsFiles).toHaveLength(2);
      expect(tsFiles.every((f) => f.endsWith('.ts'))).toBe(true);
    });

    it('should skip node_modules directory', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true });
      await fs.writeFile(path.join(testDir, 'node_modules', 'file.js'), '');

      const files = await scanDirectory(testDir);
      expect(files.every((f) => !f.includes('node_modules'))).toBe(true);
    });
  });

  describe('getLineNumber', () => {
    it('should return correct line number for index', () => {
      const content = 'line1\nline2\nline3';
      expect(getLineNumber(content, 0)).toBe(1);
      expect(getLineNumber(content, 6)).toBe(2);
      expect(getLineNumber(content, 12)).toBe(3);
    });
  });

  describe('readMultipleFiles', () => {
    it('should read multiple files', async () => {
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2');

      const files = await readMultipleFiles([
        path.join(testDir, 'file1.txt'),
        path.join(testDir, 'file2.txt'),
      ]);

      expect(files).toHaveLength(2);
      expect(files[0].content).toBe('content1');
      expect(files[1].content).toBe('content2');
    });

    it('should include file paths in results', async () => {
      await fs.writeFile(path.join(testDir, 'test.txt'), 'test');

      const files = await readMultipleFiles([path.join(testDir, 'test.txt')]);

      expect(files[0].path).toBe(path.join(testDir, 'test.txt'));
    });
  });
});
