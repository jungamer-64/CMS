/**
 * Deploy scripts type definitions
 */

export interface DeployConfig {
  readonly environment: 'development' | 'staging' | 'production';
  readonly appName: string;
  readonly deployPath: string;
  readonly backupPath: string;
  readonly repoUrl: string;
  readonly domain: string;
  readonly email: string;
}

export interface CoreServerConfig extends DeployConfig {
  readonly serverNumber: string;
  readonly username: string;
  readonly serverHost: string;
  readonly sshKeyPath: string;
  readonly port: number;
}

export interface EnvironmentVariables {
  readonly MONGODB_URI: string;
  readonly MONGODB_DB: string;
  readonly JWT_SECRET: string;
  readonly API_KEYS_DATA: string;
  readonly DEFAULT_API_KEY: string;
  readonly NODE_ENV: string;
  readonly NEXT_PUBLIC_APP_URL: string;
  readonly HOSTNAME: string;
  readonly PORT: string;
  readonly ADMIN_USERNAME: string;
  readonly ADMIN_PASSWORD: string;
  readonly ADMIN_EMAIL: string;
  readonly SESSION_SECRET: string;
  readonly UPLOAD_MAX_SIZE: string;
  readonly UPLOAD_ALLOWED_TYPES: string;
  readonly CORS_ORIGIN: string;
  readonly RATE_LIMIT_MAX: string;
  readonly RATE_LIMIT_WINDOW: string;
  readonly DEBUG_MODE: string;
  readonly LOG_LEVEL: string;
}

export interface ProcessInfo {
  readonly pid: number;
  readonly command: string;
  readonly status: 'running' | 'stopped';
}

export interface SystemStatus {
  readonly timestamp: string;
  readonly hostname: string;
  readonly platform: string;
  readonly uptime: number;
  readonly nodeJs: {
    readonly installed: boolean;
    readonly version?: string;
  };
  readonly npm: {
    readonly installed: boolean;
    readonly version?: string;
  };
  readonly pnpm: {
    readonly installed: boolean;
    readonly version?: string;
  };
  readonly git: {
    readonly installed: boolean;
    readonly version?: string;
  };
  readonly processes: ProcessInfo[];
  readonly diskUsage: {
    readonly percentage: number;
    readonly available: string;
    readonly used: string;
  };
  readonly memory: {
    readonly total: string;
    readonly used: string;
    readonly free: string;
  };
  readonly cpu: {
    readonly usage: number;
  };
  readonly application?: {
    readonly name: string;
    readonly environment: Environment;
    readonly deployPath: string;
    readonly running: boolean;
    readonly port: number;
    readonly process?: ProcessInfo;
    readonly uptime?: string;
    readonly health: 'healthy' | 'unhealthy' | 'stopped';
  };
}

export interface DeployResult {
  readonly success: boolean;
  readonly message: string;
  readonly deployPath?: string;
  readonly backupCreated?: boolean;
  readonly buildSuccessful?: boolean;
  readonly serverStarted?: boolean;
  readonly errors?: string[];
}

export interface MaintenanceCommand {
  readonly name: 'status' | 'logs' | 'restart' | 'stop' | 'start' | 'update' | 'backup' | 'cleanup' | 'health' | 'env';
  readonly description: string;
  readonly requiresArgs?: boolean;
}

export interface LogOptions {
  readonly lines?: number;
  readonly follow?: boolean;
  readonly level?: string;
  readonly filter?: string;
}

export interface BackupOptions {
  readonly includeUploads?: boolean;
  readonly includeLogs?: boolean;
  readonly includeDatabase?: boolean;
  readonly maxBackups?: number;
}

/**
 * Supported maintenance operations
 */
export type MaintenanceOperation = 
  | 'start' 
  | 'stop' 
  | 'restart' 
  | 'status' 
  | 'logs' 
  | 'backup' 
  | 'cleanup' 
  | 'update';

export const DEPLOY_COMMANDS = [
  'status',
  'logs', 
  'restart',
  'stop',
  'start',
  'update',
  'backup',
  'cleanup',
  'health',
  'env'
] as const;

export type DeployCommandType = typeof DEPLOY_COMMANDS[number];

export const ENVIRONMENTS = ['development', 'staging', 'production'] as const;
export type Environment = typeof ENVIRONMENTS[number];

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;
export type LogLevel = typeof LOG_LEVELS[number];
