import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { verifySpecComments } from '../verify.js';

describe('verifySpecComments', () => {
  const testDir = path.join(process.cwd(), '.test-verify');

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should return complete status when all files have markers', async () => {
    const file1 = path.join(testDir, 'file1.ts');
    const file2 = path.join(testDir, 'file2.ts');

    await fs.writeFile(file1, '// @spec-impl[状態:TODO]\nexport function test1() {}');
    await fs.writeFile(file2, '// @spec-impl[状態:TODO]\nexport function test2() {}');

    const result = await verifySpecComments({
      target_files: [file1, file2],
    });

    expect(result.status).toBe('complete');
    expect(result.files).toHaveLength(2);
    expect(result.files[0].has_spec_marker).toBe(true);
    expect(result.files[1].has_spec_marker).toBe(true);
  });

  it('should return incomplete status when some files are missing markers', async () => {
    const file1 = path.join(testDir, 'file1.ts');
    const file2 = path.join(testDir, 'file2.ts');

    await fs.writeFile(file1, '// @spec-impl[状態:TODO]\nexport function test1() {}');
    await fs.writeFile(file2, 'export function test2() {}'); // No marker

    const result = await verifySpecComments({
      target_files: [file1, file2],
    });

    expect(result.status).toBe('incomplete');
    expect(result.files).toHaveLength(2);
    expect(result.files[0].has_spec_marker).toBe(true);
    expect(result.files[1].has_spec_marker).toBe(false);
  });

  it('should count markers correctly', async () => {
    const file = path.join(testDir, 'file.ts');

    await fs.writeFile(
      file,
      '// @spec-impl[状態:TODO]\nexport function test1() {}\n// @spec-impl[状態:TODO]\nexport function test2() {}'
    );

    const result = await verifySpecComments({
      target_files: [file],
    });

    expect(result.files[0].marker_count).toBe(2);
  });
});
