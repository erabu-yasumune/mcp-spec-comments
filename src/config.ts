import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface Config {
  templates: {
    directory: string;
    use_defaults: boolean;
  };
  rules: {
    design_rules?: string;
    comment_rules?: string;
    implementation_rules?: string;
  };
  output: {
    base_directory: string;
    requirements_filename: string;
    design_filename: string;
    implementation_log_filename: string;
  };
  project: {
    root: string;
    source: string;
  };
}

const DEFAULT_CONFIG: Config = {
  templates: {
    directory: './templates',
    use_defaults: true,
  },
  rules: {
    design_rules: path.join(__dirname, '..', 'templates', 'defaults', 'design.md'),
    comment_rules: path.join(__dirname, '..', 'templates', 'defaults', 'comment-rules.md'),
    implementation_rules: path.join(__dirname, '..', 'templates', 'defaults', 'implementation-rules.md'),
  },
  output: {
    base_directory: './.spec-comments',
    requirements_filename: 'requirements.md',
    design_filename: 'design.md',
    implementation_log_filename: 'implementation.log',
  },
  project: {
    root: '.',
    source: './src',
  },
};

let cachedConfig: Config | null = null;

export async function loadConfig(configPath?: string): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configFile = configPath || path.join(process.cwd(), 'spec-comments.config.yml');

  try {
    const fileContent = await fs.readFile(configFile, 'utf-8');
    const loadedConfig = yaml.load(fileContent) as Partial<Config>;

    cachedConfig = {
      templates: { ...DEFAULT_CONFIG.templates, ...loadedConfig.templates },
      rules: { ...DEFAULT_CONFIG.rules, ...loadedConfig.rules },
      output: { ...DEFAULT_CONFIG.output, ...loadedConfig.output },
      project: { ...DEFAULT_CONFIG.project, ...loadedConfig.project },
    };

    return cachedConfig;
  } catch (error) {
    // Config file not found, use defaults
    console.error(`Config file not found at ${configFile}, using defaults`);
    cachedConfig = {
      templates: { ...DEFAULT_CONFIG.templates },
      rules: { ...DEFAULT_CONFIG.rules },
      output: { ...DEFAULT_CONFIG.output },
      project: { ...DEFAULT_CONFIG.project },
    };
    return cachedConfig;
  }
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
