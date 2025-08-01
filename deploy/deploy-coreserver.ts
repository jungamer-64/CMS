#!/usr/bin/env node

import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Environment, DeployResult } from './types.js';
import { getCoreServerConfig, generateEnvFileContent } from './config.js';
import { 
  executeCommand, 
  ensureDirectory, 
  writeFileWithDir, 
  commandExists,
  retry 
} from './utils.js';

/**
 * CoreServer deployment script with type safety
 */
export class CoreServerDeployer {
  private readonly config;
  private readonly environment: Environment;

  constructor(environment: Environment = 'production') {
    this.environment = environment;
    this.config = getCoreServerConfig(environment);
  }

  /**
   * Main deployment process
   */
  async deploy(): Promise<DeployResult> {
    console.log(`🚀 Starting CoreServer deployment for ${this.config.appName} (${this.environment})`);
    
    try {
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Create backup
      const backupCreated = await this.createBackup();
      
      // Setup deployment directory
      await this.setupDeploymentDirectory();
      
      // Clone or update repository
      await this.updateRepository();
      
      // Setup environment files
      await this.setupEnvironmentFiles();
      
      // Install dependencies and build
      const buildSuccessful = await this.buildApplication();
      
      // Setup server files
      await this.setupServerFiles();
      
      // Create process management configuration
      await this.setupProcessManagement();
      
      console.log('✅ Deployment completed successfully');
      
      return {
        success: true,
        message: 'Deployment completed successfully',
        deployPath: this.config.deployPath,
        backupCreated,
        buildSuccessful,
        serverStarted: false // Manual start required
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Deployment failed: ${errorMessage}`);
      
      return {
        success: false,
        message: `Deployment failed: ${errorMessage}`,
        errors: [errorMessage]
      };
    }
  }

  /**
   * Pre-deployment environment checks
   */
  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check Node.js
    if (!(await commandExists('node'))) {
      throw new Error('Node.js is not installed or not accessible');
    }
    
    // Check Git
    if (!(await commandExists('git'))) {
      throw new Error('Git is not installed or not accessible');
    }
    
    // Prefer pnpm, fallback to npm
    const hasPackageManager = (await commandExists('pnpm')) || (await commandExists('npm'));
    if (!hasPackageManager) {
      throw new Error('No package manager (pnpm or npm) found');
    }
    
    console.log('✅ Pre-deployment checks passed');
  }

  /**
   * Create backup of existing deployment
   */
  private async createBackup(): Promise<boolean> {
    if (!existsSync(this.config.deployPath)) {
      console.log('ℹ️ No existing deployment to backup');
      return false;
    }

    console.log('📦 Creating backup...');
    ensureDirectory(this.config.backupPath);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = join(this.config.backupPath, `backup-${timestamp}`);
    
    await executeCommand(`cp -r "${this.config.deployPath}" "${backupDir}"`);
    
    // Keep only 3 most recent backups
    const cleanupResult = await executeCommand(
      `find "${this.config.backupPath}" -maxdepth 1 -name "backup-*" -type d | sort -r | tail -n +4 | xargs rm -rf`,
      { silent: true }
    );
    
    if (cleanupResult.success) {
      console.log('🧹 Cleaned up old backups');
    }
    
    console.log(`✅ Backup created: ${backupDir}`);
    return true;
  }

  /**
   * Setup deployment directory
   */
  private async setupDeploymentDirectory(): Promise<void> {
    console.log('📁 Setting up deployment directory...');
    ensureDirectory(this.config.deployPath);
  }

  /**
   * Clone or update repository
   */
  private async updateRepository(): Promise<void> {
    console.log('📥 Updating repository...');
    
    const gitDir = join(this.config.deployPath, '.git');
    
    if (existsSync(gitDir)) {
      console.log('🔄 Updating existing repository...');
      await executeCommand('git fetch --all', { cwd: this.config.deployPath });
      await executeCommand('git reset --hard origin/master', { cwd: this.config.deployPath });
      await executeCommand('git clean -fd', { cwd: this.config.deployPath });
    } else {
      console.log('⬇️ Cloning repository...');
      await executeCommand(`git clone ${this.config.repoUrl} .`, { cwd: this.config.deployPath });
    }
    
    console.log('✅ Repository updated');
  }

  /**
   * Setup environment files
   */
  private async setupEnvironmentFiles(): Promise<void> {
    console.log('⚙️ Setting up environment files...');
    
    const envSourcePath = join(process.env.HOME || '', `.env.${this.environment}`);
    const envTargetPath = join(this.config.deployPath, '.env');
    
    // Try to copy from home directory first
    if (existsSync(envSourcePath)) {
      copyFileSync(envSourcePath, envTargetPath);
      console.log(`✅ Environment file copied from: ${envSourcePath}`);
    } else {
      console.log('⚠️ No environment file found in home directory, generating default...');
      
      // Generate default environment file
      const envContent = generateEnvFileContent(this.config);
      writeFileWithDir(envTargetPath, envContent);
      console.log('📄 Default environment file created');
      console.log('⚠️ Please update the .env file with actual values before starting the application');
    }
    
    // Copy CoreServer-specific Next.js config
    const nextConfigSource = join(this.config.deployPath, 'deploy', 'next.config.coreserver.ts');
    const nextConfigTarget = join(this.config.deployPath, 'next.config.ts');
    
    if (existsSync(nextConfigSource)) {
      copyFileSync(nextConfigSource, nextConfigTarget);
      console.log('✅ CoreServer Next.js config applied');
    } else {
      console.log('⚠️ CoreServer Next.js config not found');
    }
  }

  /**
   * Install dependencies and build application
   */
  private async buildApplication(): Promise<boolean> {
    console.log('🔨 Building application...');
    
    const cwd = this.config.deployPath;
    
    // Install pnpm if not available
    if (!(await commandExists('pnpm'))) {
      console.log('📦 Installing pnpm...');
      await executeCommand('npm install -g pnpm');
    }
    
    // Install dependencies
    console.log('📦 Installing dependencies...');
    await retry(() => executeCommand('pnpm install --frozen-lockfile', { cwd }));
    
    // Build application
    console.log('🏗️ Building application...');
    const buildResult = await executeCommand('pnpm run build', { cwd });
    
    if (!buildResult.success) {
      throw new Error(`Build failed: ${buildResult.stderr}`);
    }
    
    console.log('✅ Application built successfully');
    return true;
  }

  /**
   * Setup server startup files
   */
  private async setupServerFiles(): Promise<void> {
    console.log('🖥️ Setting up server files...');
    
    const standaloneDir = join(this.config.deployPath, '.next', 'standalone');
    const serverJsPath = join(this.config.deployPath, 'server.js');
    
    if (existsSync(standaloneDir)) {
      console.log('🚀 Standalone build detected, creating launcher...');
      
      const launcherScript = `#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

console.log(\`🚀 Starting application on http://\${hostname}:\${port}\`);

// Change to standalone directory and start server
process.chdir(path.join(__dirname, '.next', 'standalone'));

// Import and start the standalone server
require('./server.js');
`;
      
      writeFileWithDir(serverJsPath, launcherScript);
      await executeCommand(`chmod +x "${serverJsPath}"`);
      
      // Copy public and static files to standalone
      const publicDir = join(this.config.deployPath, 'public');
      const staticDir = join(this.config.deployPath, '.next', 'static');
      
      if (existsSync(publicDir)) {
        await executeCommand(`cp -r "${publicDir}" "${standaloneDir}/"`);
      }
      
      if (existsSync(staticDir)) {
        await executeCommand(`cp -r "${staticDir}" "${standaloneDir}/.next/"`);
      }
      
    } else {
      console.log('📦 Regular build detected, creating standard launcher...');
      
      const standardScript = `#!/usr/bin/env node

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = process.env.HOSTNAME || 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(\`🚀 Ready on http://\${hostname}:\${port}\`);
  });
});
`;
      
      writeFileWithDir(serverJsPath, standardScript);
      await executeCommand(`chmod +x "${serverJsPath}"`);
    }
    
    console.log('✅ Server files configured');
  }

  /**
   * Setup process management configuration
   */
  private async setupProcessManagement(): Promise<void> {
    console.log('⚙️ Setting up process management...');
    
    // Create .htaccess for Apache environments
    const htaccessContent = `RewriteEngine On

# Next.js static files
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} ^/_next/static/
RewriteRule ^(.*)$ /.next/static/$1 [L]

# Next.js API routes and pages - proxy to Node.js server
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Prevent access to sensitive files
<Files ~ "^\\.env">
    Order allow,deny
    Deny from all
</Files>

<Files ~ "^\\.git">
    Order allow,deny
    Deny from all
</Files>

<Files ~ "node_modules">
    Order allow,deny
    Deny from all
</Files>
`;
    
    const htaccessPath = join(this.config.deployPath, '.htaccess');
    writeFileWithDir(htaccessPath, htaccessContent);
    
    // Check for supervisor
    if (await commandExists('supervisorctl')) {
      console.log('👨‍💼 Creating Supervisor configuration...');
      
      const supervisorConfig = `[program:${this.config.appName}]
directory=${this.config.deployPath}
command=node server.js
autostart=true
autorestart=true
stderr_logfile=/home/rebelor/domains/${this.config.domain}/logs/${this.config.appName}.err.log
stdout_logfile=/home/rebelor/domains/${this.config.domain}/logs/${this.config.appName}.out.log
environment=NODE_ENV="${this.environment}",PORT="3000"
`;
      
      const supervisorConfigPath = join(this.config.deployPath, `${this.config.appName}.conf`);
      writeFileWithDir(supervisorConfigPath, supervisorConfig);
      
      // Ensure log directory exists
      ensureDirectory(`/home/rebelor/domains/${this.config.domain}/logs`);
      
      console.log('📄 Supervisor configuration created');
      console.log('ℹ️ Please add this configuration to your supervisor setup');
    }
    
    console.log('✅ Process management configured');
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const environment = (args[0] as Environment) || 'production';
  
  if (!['development', 'staging', 'production'].includes(environment)) {
    console.error('❌ Invalid environment. Use: development, staging, or production');
    process.exit(1);
  }
  
  const deployer = new CoreServerDeployer(environment);
  const result = await deployer.deploy();
  
  if (result.success) {
    console.log('\n🎉 Deployment Summary:');
    console.log(`  • Environment: ${environment}`);
    console.log(`  • Deploy Path: ${result.deployPath}`);
    console.log(`  • Backup Created: ${result.backupCreated ? '✅' : '❌'}`);
    console.log(`  • Build Successful: ${result.buildSuccessful ? '✅' : '❌'}`);
    console.log('\n📋 Next steps:');
    console.log('  1. Start the Node.js process: node server.js');
    console.log('  2. Verify CoreServer domain settings');
    console.log('  3. Confirm Cloudflare SSL is active');
    
    process.exit(0);
  } else {
    console.error(`\n❌ Deployment failed: ${result.message}`);
    if (result.errors) {
      result.errors.forEach(error => console.error(`  • ${error}`));
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
