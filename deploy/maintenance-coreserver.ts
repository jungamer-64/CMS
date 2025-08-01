#!/usr/bin/env node

import { existsSync } from 'fs';
import { join } from 'path';
import type { Environment, SystemStatus, MaintenanceOperation } from './types.js';
import { getCoreServerConfig } from './config.js';
import { 
  executeCommand, 
  getSystemStatus, 
  findProcessByPort,
  killProcess,
  ensureDirectory
} from './utils.js';

/**
 * CoreServer maintenance and management system
 */
export class CoreServerMaintenance {
  private readonly config;
  private readonly environment: Environment;

  constructor(environment: Environment = 'production') {
    this.environment = environment;
    this.config = getCoreServerConfig(environment);
  }

  /**
   * Start the application server
   */
  async start(): Promise<boolean> {
    console.log(`🚀 Starting ${this.config.appName} server...`);
    
    try {
      // Check if server is already running
      const existingProcess = await findProcessByPort(this.config.port);
      if (existingProcess) {
        console.log(`⚠️ Server already running on port ${this.config.port} (PID: ${existingProcess.pid})`);
        return true;
      }

      // Verify deployment exists
      if (!existsSync(this.config.deployPath)) {
        throw new Error(`Deployment not found at: ${this.config.deployPath}`);
      }

      // Check for standalone build
      const standaloneDir = join(this.config.deployPath, '.next', 'standalone');
      const serverScript = existsSync(standaloneDir) ? 'server.js' : 'server.js';
      
      if (!existsSync(join(this.config.deployPath, serverScript))) {
        throw new Error(`Server script not found: ${serverScript}`);
      }

      // Start the server
      console.log(`📋 Starting with ${existsSync(standaloneDir) ? 'standalone' : 'regular'} build...`);
      
      const startCommand = `cd "${this.config.deployPath}" && NODE_ENV=${this.environment} PORT=${this.config.port} node ${serverScript}`;
      
      // Start in background
      const result = await executeCommand(startCommand, { 
        background: true,
        cwd: this.config.deployPath 
      });

      if (result.success) {
        // Wait for server to be ready
        console.log('⏳ Waiting for server to start...');
        await this.waitForServer();
        
        console.log(`✅ Server started successfully on port ${this.config.port}`);
        return true;
      } else {
        throw new Error(`Failed to start server: ${result.stderr}`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to start server: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Stop the application server
   */
  async stop(): Promise<boolean> {
    console.log(`🛑 Stopping ${this.config.appName} server...`);
    
    try {
      const process = await findProcessByPort(this.config.port);
      
      if (!process) {
        console.log('ℹ️ Server is not running');
        return true;
      }

      console.log(`🔍 Found process (PID: ${process.pid})`);
      
      // Graceful shutdown
      const stopped = await killProcess(process.pid, 'SIGTERM');
      
      if (stopped) {
        console.log('✅ Server stopped gracefully');
        return true;
      } else {
        console.log('⚠️ Graceful shutdown failed, forcing termination...');
        const forced = await killProcess(process.pid, 'SIGKILL');
        
        if (forced) {
          console.log('✅ Server force stopped');
          return true;
        } else {
          throw new Error('Failed to stop server');
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to stop server: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Restart the application server
   */
  async restart(): Promise<boolean> {
    console.log(`🔄 Restarting ${this.config.appName} server...`);
    
    const stopped = await this.stop();
    if (!stopped) {
      console.error('❌ Failed to stop server, cannot restart');
      return false;
    }

    // Wait a moment before starting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return await this.start();
  }

  /**
   * Get current server status
   */
  async status(): Promise<SystemStatus> {
    console.log(`📊 Checking ${this.config.appName} status...`);
    
    try {
      const systemStatus = await getSystemStatus();
      const process = await findProcessByPort(this.config.port);
      
      const status: SystemStatus = {
        ...systemStatus,
        application: {
          name: this.config.appName,
          environment: this.environment,
          deployPath: this.config.deployPath,
          running: !!process,
          port: this.config.port,
          process: process || undefined,
          uptime: process ? await this.getProcessUptime(process.pid) : undefined,
          health: process ? await this.checkHealth() : 'stopped'
        }
      };

      this.printStatus(status);
      return status;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to get status: ${errorMessage}`);
      
      return {
        timestamp: new Date().toISOString(),
        hostname: 'unknown',
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: { usage: 0 },
        application: {
          name: this.config.appName,
          environment: this.environment,
          deployPath: this.config.deployPath,
          running: false,
          port: this.config.port,
          health: 'error'
        }
      };
    }
  }

  /**
   * View application logs
   */
  async logs(lines: number = 50, follow: boolean = false): Promise<void> {
    console.log(`📋 Viewing ${this.config.appName} logs (last ${lines} lines)...`);
    
    const logPath = join(this.config.deployPath, 'logs', 'application.log');
    
    if (!existsSync(logPath)) {
      console.log('ℹ️ No log file found');
      return;
    }

    const command = follow 
      ? `tail -f -n ${lines} "${logPath}"`
      : `tail -n ${lines} "${logPath}"`;
    
    await executeCommand(command, { 
      stdio: 'inherit',
      background: follow 
    });
  }

  /**
   * Create backup of current deployment
   */
  async backup(): Promise<string | null> {
    console.log(`📦 Creating backup of ${this.config.appName}...`);
    
    try {
      if (!existsSync(this.config.deployPath)) {
        console.log('ℹ️ No deployment found to backup');
        return null;
      }

      ensureDirectory(this.config.backupPath);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = join(this.config.backupPath, `backup-${timestamp}`);
      
      await executeCommand(`cp -r "${this.config.deployPath}" "${backupDir}"`);
      
      console.log(`✅ Backup created: ${backupDir}`);
      return backupDir;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Backup failed: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Clean up old backups and logs
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up ${this.config.appName} files...`);
    
    try {
      // Clean old backups (keep 5 most recent)
      if (existsSync(this.config.backupPath)) {
        await executeCommand(
          `find "${this.config.backupPath}" -maxdepth 1 -name "backup-*" -type d | sort -r | tail -n +6 | xargs rm -rf`,
          { silent: true }
        );
        console.log('✅ Old backups cleaned');
      }

      // Rotate logs (keep 10MB max)
      const logPath = join(this.config.deployPath, 'logs', 'application.log');
      if (existsSync(logPath)) {
        const stats = await executeCommand(`stat -f%z "${logPath}" 2>/dev/null || stat -c%s "${logPath}"`, { silent: true });
        const size = parseInt(stats.stdout.trim()) || 0;
        
        if (size > 10 * 1024 * 1024) { // 10MB
          const rotatedPath = `${logPath}.${Date.now()}`;
          await executeCommand(`mv "${logPath}" "${rotatedPath}"`);
          await executeCommand(`touch "${logPath}"`);
          console.log('✅ Log rotated');
        }
      }

      // Clean temporary files
      const tempFiles = [
        join(this.config.deployPath, '.next', 'cache'),
        join(this.config.deployPath, 'node_modules', '.cache')
      ];

      for (const tempFile of tempFiles) {
        if (existsSync(tempFile)) {
          await executeCommand(`rm -rf "${tempFile}"`, { silent: true });
        }
      }
      
      console.log('✅ Cleanup completed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Cleanup failed: ${errorMessage}`);
    }
  }

  /**
   * Update application from repository
   */
  async update(): Promise<boolean> {
    console.log(`🔄 Updating ${this.config.appName}...`);
    
    try {
      // Create backup before update
      await this.backup();
      
      // Update repository
      await executeCommand('git fetch --all', { cwd: this.config.deployPath });
      await executeCommand('git reset --hard origin/master', { cwd: this.config.deployPath });
      
      // Update dependencies
      await executeCommand('pnpm install --frozen-lockfile', { cwd: this.config.deployPath });
      
      // Rebuild application
      await executeCommand('pnpm run build', { cwd: this.config.deployPath });
      
      console.log('✅ Update completed');
      console.log('ℹ️ Restart the server to apply changes');
      
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Update failed: ${errorMessage}`);
      return false;
    }
  }

  /**
   * Wait for server to be ready
   */
  private async waitForServer(maxAttempts: number = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      const process = await findProcessByPort(this.config.port);
      if (process) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Server did not start within expected time');
  }

  /**
   * Get process uptime
   */
  private async getProcessUptime(pid: number): Promise<string> {
    try {
      const result = await executeCommand(`ps -o lstart= -p ${pid}`, { silent: true });
      if (result.success) {
        const startTime = new Date(result.stdout.trim());
        const uptime = Date.now() - startTime.getTime();
        return this.formatUptime(uptime);
      }
    } catch {
      // Fallback - return unknown if we can't get uptime
    }
    return 'unknown';
  }

  /**
   * Format uptime in human readable format
   */
  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Check application health
   */
  private async checkHealth(): Promise<'healthy' | 'unhealthy' | 'stopped'> {
    try {
      const healthUrl = `http://localhost:${this.config.port}/api/health`;
      const result = await executeCommand(`curl -s -o /dev/null -w "%{http_code}" "${healthUrl}"`, { 
        silent: true,
        timeout: 5000 
      });
      
      const statusCode = parseInt(result.stdout.trim());
      return statusCode === 200 ? 'healthy' : 'unhealthy';
    } catch {
      return 'unhealthy';
    }
  }

  /**
   * Print formatted status information
   */
  private printStatus(status: SystemStatus): void {
    console.log('\n📊 System Status:');
    console.log(`  Host: ${status.hostname}`);
    console.log(`  Platform: ${status.platform}`);
    console.log(`  System Uptime: ${this.formatUptime(status.uptime * 1000)}`);
    console.log(`  Memory: ${Math.round(status.memory.rss / 1024 / 1024)}MB RSS`);
    
    console.log('\n🚀 Application Status:');
    console.log(`  Name: ${status.application.name}`);
    console.log(`  Environment: ${status.application.environment}`);
    console.log(`  Running: ${status.application.running ? '✅' : '❌'}`);
    console.log(`  Port: ${status.application.port}`);
    console.log(`  Health: ${status.application.health === 'healthy' ? '✅' : status.application.health === 'unhealthy' ? '⚠️' : '❌'} ${status.application.health}`);
    
    if (status.application.process) {
      console.log(`  PID: ${status.application.process.pid}`);
      console.log(`  Command: ${status.application.process.command}`);
    }
    
    if (status.application.uptime) {
      console.log(`  Uptime: ${status.application.uptime}`);
    }
    
    console.log(`  Deploy Path: ${status.application.deployPath}`);
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🛠️  CoreServer Maintenance Tool

Usage:
  node maintenance-coreserver.ts <operation> [environment] [options]

Operations:
  start     - Start the application server
  stop      - Stop the application server  
  restart   - Restart the application server
  status    - Show server status
  logs      - View application logs
  backup    - Create deployment backup
  cleanup   - Clean old files and logs
  update    - Update from repository

Environment:
  development, staging, production (default: production)

Examples:
  node maintenance-coreserver.ts start
  node maintenance-coreserver.ts status production
  node maintenance-coreserver.ts logs development --follow
`);
    process.exit(0);
  }

  const operation = args[0] as MaintenanceOperation;
  const environment = (args[1] as Environment) || 'production';
  
  if (!['start', 'stop', 'restart', 'status', 'logs', 'backup', 'cleanup', 'update'].includes(operation)) {
    console.error('❌ Invalid operation');
    process.exit(1);
  }

  if (!['development', 'staging', 'production'].includes(environment)) {
    console.error('❌ Invalid environment');
    process.exit(1);
  }

  const maintenance = new CoreServerMaintenance(environment);
  let success = true;

  try {
    switch (operation) {
      case 'start':
        success = await maintenance.start();
        break;
      case 'stop':
        success = await maintenance.stop();
        break;
      case 'restart':
        success = await maintenance.restart();
        break;
      case 'status':
        await maintenance.status();
        break;
      case 'logs':
        const lines = parseInt(args[2]) || 50;
        const follow = args.includes('--follow');
        await maintenance.logs(lines, follow);
        break;
      case 'backup':
        const backupPath = await maintenance.backup();
        success = !!backupPath;
        break;
      case 'cleanup':
        await maintenance.cleanup();
        break;
      case 'update':
        success = await maintenance.update();
        break;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Operation failed: ${errorMessage}`);
    success = false;
  }

  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
