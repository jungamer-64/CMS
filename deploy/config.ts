import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { 
  DeployConfig, 
  CoreServerConfig, 
  EnvironmentVariables, 
  Environment 
} from './types.js';

/**
 * Default configuration for different environments
 */
const DEFAULT_CONFIGS: Record<Environment, Partial<DeployConfig>> = {
  development: {
    environment: 'development',
    appName: 'jgm-blog-dev',
    domain: 'localhost',
    email: 'dev@localhost'
  },
  staging: {
    environment: 'staging',
    appName: 'jgm-blog-staging',
    domain: 'staging.jungamer.uk',
    email: 'jumpeitakino@hotmail.com'
  },
  production: {
    environment: 'production',
    appName: 'jgm-blog',
    domain: 'jungamer.uk',
    email: 'jumpeitakino@hotmail.com'
  }
};

/**
 * CoreServer specific configuration
 */
export const CORESERVER_CONFIG: Omit<CoreServerConfig, keyof DeployConfig> = {
  serverNumber: 'v2008',
  username: 'rebelor',
  serverHost: 'v2008.coreserver.jp',
  sshKeyPath: join(process.env.USERPROFILE || process.env.HOME || '', '.ssh', 'jgm_rsa'),
  port: 3000
};

/**
 * Load and validate environment variables
 */
export function loadEnvironmentVariables(envPath?: string): Partial<EnvironmentVariables> {
  const envFile = envPath || join(process.cwd(), '.env');
  
  if (!existsSync(envFile)) {
    console.warn(`⚠️ Environment file not found: ${envFile}`);
    return {};
  }

  try {
    const envContent = readFileSync(envFile, 'utf-8');
    const envVars: Record<string, string> = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove surrounding quotes if present
          const cleanValue = value.replace(/^["'](.*)["']$/, '$1');
          envVars[key.trim()] = cleanValue;
        }
      }
    });

    return envVars as Partial<EnvironmentVariables>;
  } catch (error) {
    console.error(`❌ Failed to load environment file: ${error}`);
    return {};
  }
}

/**
 * Get deploy configuration for specified environment
 */
export function getDeployConfig(environment: Environment): DeployConfig {
  const baseConfig = DEFAULT_CONFIGS[environment];
  
  const config: DeployConfig = {
    environment,
    appName: baseConfig.appName || 'jgm-blog',
    deployPath: `/home/rebelor/domains/${baseConfig.domain}/public_html`,
    backupPath: `/home/rebelor/domains/${baseConfig.domain}/private_html/backup`,
    repoUrl: 'https://github.com/jungamer-64/test-website.git',
    domain: baseConfig.domain || 'jungamer.uk',
    email: baseConfig.email || 'jumpeitakino@hotmail.com'
  };

  return config;
}

/**
 * Get CoreServer specific configuration
 */
export function getCoreServerConfig(environment: Environment): CoreServerConfig {
  const deployConfig = getDeployConfig(environment);
  
  return {
    ...deployConfig,
    ...CORESERVER_CONFIG
  };
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentVariables(envVars: Partial<EnvironmentVariables>): {
  valid: boolean;
  missing: string[];
} {
  const required: (keyof EnvironmentVariables)[] = [
    'MONGODB_URI',
    'MONGODB_DB',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];

  const missing = required.filter(key => !envVars[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Generate environment file content
 */
export function generateEnvFileContent(config: DeployConfig, additional: Partial<EnvironmentVariables> = {}): string {
  const defaultEnvVars: Partial<EnvironmentVariables> = {
    NODE_ENV: config.environment,
    NEXT_PUBLIC_APP_URL: `https://${config.domain}`,
    HOSTNAME: 'localhost',
    PORT: '3000',
    ADMIN_EMAIL: config.email,
    CORS_ORIGIN: `https://${config.domain}`,
    RATE_LIMIT_MAX: '50',
    RATE_LIMIT_WINDOW: '900000',
    DEBUG_MODE: config.environment === 'development' ? 'true' : 'false',
    LOG_LEVEL: config.environment === 'development' ? 'debug' : 'error',
    UPLOAD_MAX_SIZE: '5242880',
    UPLOAD_ALLOWED_TYPES: 'image/jpeg,image/png,image/gif,image/webp'
  };

  const envVars = { ...defaultEnvVars, ...additional };
  
  const lines: string[] = [
    `# ${config.environment.toUpperCase()} Environment Variables`,
    `# Generated for ${config.appName} on ${config.domain}`,
    ''
  ];

  Object.entries(envVars).forEach(([key, value]) => {
    if (value !== undefined) {
      lines.push(`${key}=${value}`);
    }
  });

  return lines.join('\n') + '\n';
}

/**
 * Validate configuration object
 */
export function validateConfig<T extends Record<string, unknown>>(
  config: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(field => 
    config[field] === undefined || config[field] === null || config[field] === ''
  ).map(field => String(field));

  return {
    valid: missing.length === 0,
    missing
  };
}
