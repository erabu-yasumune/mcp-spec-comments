import * as fs from 'fs/promises';
import * as path from 'path';
import { Config } from './config.js';

/**
 * Read a file and return its content as a string
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    const absolutePath = path.resolve(filePath);
    return await fs.readFile(absolutePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

/**
 * Write content to a file, creating directories if needed
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    const absolutePath = path.resolve(filePath);
    const directory = path.dirname(absolutePath);

    // Ensure directory exists
    await fs.mkdir(directory, { recursive: true });

    await fs.writeFile(absolutePath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write file ${filePath}: ${error}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(path.resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a file if it exists, otherwise return null
 */
export async function readFileIfExists(filePath: string): Promise<string | null> {
  if (await fileExists(filePath)) {
    return await readFile(filePath);
  }
  return null;
}

/**
 * Recursively scan a directory and return all file paths
 */
export async function scanDirectory(
  dirPath: string,
  extensions?: string[]
): Promise<string[]> {
  const results: string[] = [];

  async function scan(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and other common excluded directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          // If extensions filter provided, check file extension
          if (extensions) {
            const ext = path.extname(entry.name);
            if (extensions.includes(ext)) {
              results.push(fullPath);
            }
          } else {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}: ${error}`);
    }
  }

  await scan(path.resolve(dirPath));
  return results;
}

/**
 * Get line number for a match index in file content
 */
export function getLineNumber(content: string, index: number): number {
  const lines = content.substring(0, index).split('\n');
  return lines.length;
}

/**
 * Read multiple files and return their content with paths
 */
export async function readMultipleFiles(
  filePaths: string[]
): Promise<Array<{ path: string; content: string }>> {
  const results = await Promise.all(
    filePaths.map(async (filePath) => ({
      path: filePath,
      content: await readFile(filePath),
    }))
  );
  return results;
}

/**
 * Generate output path based on feature name
 * @param config - Configuration object
 * @param featureName - Feature name for the directory
 * @param filename - Output filename
 * @returns Full path to the output file
 */
export function generateOutputPath(
  config: Config,
  featureName: string,
  filename: string
): string {
  return path.join(config.output.base_directory, featureName, filename);
}
