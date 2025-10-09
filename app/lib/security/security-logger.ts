/**
 * セキュリティロギングシステム
 *
 * セキュリティイベントの記録と監視
 */

import fs from 'fs/promises';
import path from 'path';

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'CSRF_ATTEMPT' | 'PERMISSION_DENIED';
  ip: string;
  userAgent?: string;
  userId?: string;
  details?: string;
  timestamp: string;
}

export class SecurityLogger {
  private static instance: SecurityLogger;
  private readonly logDir: string;

  private constructor() {
    // 明示的に解決されたログディレクトリを使用してパス操作を制限
    const base = path.resolve(process.cwd());
    const safeLogDir = path.resolve(base, 'logs', 'security');
    this.logDir = safeLogDir;
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * セキュリティイベントをログに記録
   */
  async logEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString();
    const logEntry: SecurityEvent = {
      ...event,
      timestamp,
      userAgent: event.userAgent?.substring(0, 200) // User-Agentを切り詰め
    };

    // コンソールログ（開発・デバッグ用）
    console.log('[SECURITY]', JSON.stringify(logEntry));

    // 重要なセキュリティイベントの警告
    if (this.isCriticalEvent(event.type)) {
      console.warn('[SECURITY ALERT]', JSON.stringify(logEntry));
    }

    // ファイルログ（本番環境用）
    if (process.env.NODE_ENV === 'production') {
      await this.writeToFile(logEntry);
    }

    // 外部ログシステム（将来の拡張用）
    if (process.env.EXTERNAL_LOG_ENDPOINT) {
      await this.sendToExternalSystem(logEntry);
    }
  }

  /**
   * 重要なセキュリティイベントかどうかを判定
   */
  private isCriticalEvent(type: SecurityEvent['type']): boolean {
    return ['RATE_LIMIT', 'CSRF_ATTEMPT', 'PERMISSION_DENIED'].includes(type);
  }

  /**
   * ログファイルに書き込み
   */
  private async writeToFile(event: SecurityEvent): Promise<void> {
    try {
      // ログディレクトリの作成
      await fs.mkdir(this.logDir, { recursive: true });

      // 日付別のログファイル
      const today = new Date().toISOString().split('T')[0];
      // 解決済みのファイルパスを作成して検証
      const logFileName = `security-${today}.log`;
      const logFile = path.resolve(this.logDir, logFileName);

      // 誤ったパスが入らないように、必ずログディレクトリの配下であることを確認
      if (!logFile.startsWith(this.logDir)) {
        throw new Error('Resolved log file path is outside of the allowed log directory');
      }

      const logLine = JSON.stringify(event) + '\n';
      await fs.appendFile(logFile, logLine, 'utf8');
    } catch (err: unknown) {
      console.error('Failed to write security log to file:', err instanceof Error ? err : String(err));
    }
  }

  /**
   * 外部ログシステムに送信
   */
  private async sendToExternalSystem(event: SecurityEvent): Promise<void> {
    try {
      const endpoint = process.env.EXTERNAL_LOG_ENDPOINT;
      if (!endpoint) return;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LOG_API_KEY || ''}`
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        throw new Error(`Log API responded with status: ${response.status}`);
      }
    } catch (err: unknown) {
      console.error('Failed to send security log to external system:', err instanceof Error ? err : String(err));
    }
  }

  /**
   * ログの統計情報を取得
   */
  async getLogStats(_days: number = 7): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    topIPs: Array<{ ip: string; count: number }>;
  }> {
    // 実装は必要に応じて追加
    // 受け取りはするが未使用（将来の実装で使う）
    void _days;

    return {
      totalEvents: 0,
      eventsByType: {},
      topIPs: []
    };
  }
}

/**
 * セキュリティログのヘルパー関数
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const logger = SecurityLogger.getInstance();
  await logger.logEvent(event);
}
