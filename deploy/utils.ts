import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import type { 
  SystemStatus, 
  ProcessInfo, 
  LogOptions 
} from './types.js';

const execAsync = promisify(exec);

/**
 * Execute a shell command with proper error handling
 */
export async function executeCommand(
  command: string,
  options: { 
    cwd?: string;
    timeout?: number;
    silent?: boolean;
    background?: boolean;
    stdio?: 'inherit' | 'pipe';
  } = {}
): Promise<{ stdout: string; stderr: string; success: boolean }> {
  const { cwd = process.cwd(), timeout = 300000, silent = false, background = false, stdio = 'pipe' } = options;
  
  if (!silent) {
    console.log(`🔧 Executing: ${command}`);
  }

  try {
    if (background) {
      // For background processes, use spawn instead of exec
      const child = spawn('sh', ['-c', command], {
        cwd,
        detached: true,
        stdio: stdio === 'inherit' ? 'inherit' : 'ignore'
      });
      
      child.unref();
      
      return {
        stdout: '',
        stderr: '',
        success: true
      };
    }

    const { stdout, stderr } = await execAsync(command, { cwd, timeout });

    if (!silent) {
      if (stdout) console.log(`📤 stdout: ${stdout.trim()}`);
      if (stderr) console.log(`📤 stderr: ${stderr.trim()}`);
    }

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      success: true
    };
  } catch (error: unknown) {
    const err = error as { message?: string; stderr?: string };
    const errorMessage = err.message || String(error);
    const stderr = err.stderr || errorMessage;

    if (!silent) {
      console.error(`❌ Command failed: ${errorMessage}`);
    }

    return {
      stdout: '',
      stderr,
      success: false
    };
  }
}

/**
 * Check if a command/tool is available
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await executeCommand(`which ${command}`, { silent: true });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Get version of a command/tool
 */
export async function getCommandVersion(command: string): Promise<string | null> {
  try {
    const versionFlags = ['--version', '-v', '-V'];
    
    for (const flag of versionFlags) {
      const result = await executeCommand(`${command} ${flag}`, { silent: true });
      if (result.success && result.stdout) {
        // Extract version number from output
        const versionRegex = /v?(\d+\.\d+\.\d+)/;
        const versionMatch = versionRegex.exec(result.stdout);
        if (versionMatch) {
          return versionMatch[1];
        }
        // Fallback to first line
        return result.stdout.split('\n')[0].trim();
      }
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

/**
 * Get system status information
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  const [nodeVersion, npmVersion, pnpmVersion, gitVersion] = await Promise.all([
    getCommandVersion('node'),
    getCommandVersion('npm'),
    getCommandVersion('pnpm'),
    getCommandVersion('git')
  ]);

  // Get running Node.js processes
  const processes: ProcessInfo[] = [];
  const psResult = await executeCommand('ps aux | grep "node.*server.js" | grep -v grep', { silent: true });
  
  if (psResult.success && psResult.stdout) {
    psResult.stdout.split('\n').forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        processes.push({
          pid: parseInt(parts[1]),
          command: parts.slice(10).join(' '),
          status: 'running'
        });
      }
    });
  }

  // Get disk usage
  let diskUsage = { percentage: 0, available: 'Unknown', used: 'Unknown' };
  const dfResult = await executeCommand('df -h .', { silent: true });
  if (dfResult.success && dfResult.stdout) {
    const lines = dfResult.stdout.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      if (parts.length >= 5) {
        diskUsage = {
          percentage: parseInt(parts[4].replace('%', '')),
          available: parts[3],
          used: parts[2]
        };
      }
    }
  }

  // Get memory usage
  let memory = { total: 'Unknown', used: 'Unknown', free: 'Unknown' };
  const freeResult = await executeCommand('free -h', { silent: true });
  if (freeResult.success && freeResult.stdout) {
    const lines = freeResult.stdout.split('\n');
    const memLine = lines.find(line => line.startsWith('Mem:'));
    if (memLine) {
      const parts = memLine.split(/\s+/);
      if (parts.length >= 4) {
        memory = {
          total: parts[1],
          used: parts[2],
          free: parts[3]
        };
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    hostname: 'localhost', // Placeholder
    platform: process.platform,
    uptime: process.uptime(),
    nodeJs: {
      installed: nodeVersion !== null,
      version: nodeVersion || undefined
    },
    npm: {
      installed: npmVersion !== null,
      version: npmVersion || undefined
    },
    pnpm: {
      installed: pnpmVersion !== null,
      version: pnpmVersion || undefined
    },
    git: {
      installed: gitVersion !== null,
      version: gitVersion || undefined
    },
    processes,
    diskUsage,
    memory,
    cpu: {
      usage: 0 // Placeholder
    }
  };
}

/**
 * Find process running on specific port
 */
export async function findProcessByPort(port: number): Promise<ProcessInfo | null> {
  try {
    const result = await executeCommand(`lsof -i :${port} -t`, { silent: true });
    if (result.success && result.stdout.trim()) {
      const pid = parseInt(result.stdout.trim());
      
      // Get process command
      const cmdResult = await executeCommand(`ps -p ${pid} -o command=`, { silent: true });
      const command = cmdResult.success ? cmdResult.stdout.trim() : 'unknown';
      
      return {
        pid,
        command,
        status: 'running'
      };
    }
  } catch {
    // Ignore errors
  }
  
  return null;
}

/**
 * Kill process by PID
 */
export async function killProcess(pid: number, signal: string = 'SIGTERM'): Promise<boolean> {
  try {
    const result = await executeCommand(`kill -${signal} ${pid}`, { silent: true });
    
    if (result.success) {
      // Wait and check if process is gone
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const checkResult = await executeCommand(`ps -p ${pid}`, { silent: true });
      return !checkResult.success; // Success means process is gone
    }
  } catch {
    // Ignore errors
  }
  
  return false;
}

/**
 * Retry operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  throw lastError;
}

/**
 * Create directory if it doesn't exist
 */
export function ensureDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

/**
 * Write file with directory creation
 */
export function writeFileWithDir(filePath: string, content: string): void {
  const dir = dirname(filePath);
  ensureDirectory(dir);
  writeFileSync(filePath, content, 'utf8');
  console.log(`📄 Created file: ${filePath}`);
}

/**
 * Parse log line with timestamp
 */
export function parseLogLine(line: string): { timestamp: Date; level: string; message: string } | null {
  const timestampRegex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\s+(\w+)\s+(.+)$/;
  const match = timestampRegex.exec(line);
  
  if (match) {
    return {
      timestamp: new Date(match[1]),
      level: match[2],
      message: match[3]
    };
  }
  
  return null;
}

/**
 * Get formatted logs based on options
 */
export async function getLogs(logPath: string, options: LogOptions = {}): Promise<string[]> {
  const { lines = 50, level, filter } = options;
  
  if (!existsSync(logPath)) {
    return [];
  }
  
  try {
    const result = await executeCommand(`tail -n ${lines} "${logPath}"`, { silent: true });
    
    if (!result.success) {
      return [];
    }
    
    let logLines = result.stdout.split('\n').filter(line => line.trim());
    
    // Filter by level if specified
    if (level) {
      logLines = logLines.filter(line => {
        const parsed = parseLogLine(line);
        return parsed && parsed.level.toLowerCase() === level.toLowerCase();
      });
    }
    
    // Filter by text if specified
    if (filter) {
      logLines = logLines.filter(line => line.includes(filter));
    }
    
    return logLines;
    
  } catch {
    return [];
  }
}
