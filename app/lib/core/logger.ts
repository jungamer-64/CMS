/**
 * 統一ロギングシステム
 *
 * 目的:
 * - アプリケーション全体で一貫したログ出力
 * - 構造化されたJSON形式のログ
 * - ログレベル管理（error, warn, info, debug）
 * - 本番環境と開発環境での適切なログ出力
 * - 外部ロギングサービスへの統合ポイント
 *
 * 使用例:
 * ```typescript
 * import { logger } from '@/app/lib/core/logger';
 *
 * // 基本的なログ
 * logger.info('ユーザーがログインしました', { userId: '123' });
 * logger.error('データベースエラーが発生しました', { error: err });
 *
 * // コンテキスト付きロガー
 * const userLogger = logger.child({ userId: '123', module: 'auth' });
 * userLogger.info('パスワードを変更しました');
 * ```
 */

/**
 * ログレベル - 重要度の順
 */
export enum LogLevel {
    /** エラー - システムの動作に影響する問題 */
    ERROR = 'error',
    /** 警告 - 問題があるが動作は継続 */
    WARN = 'warn',
    /** 情報 - 通常の動作ログ */
    INFO = 'info',
    /** デバッグ - 開発時の詳細情報 */
    DEBUG = 'debug',
}

/**
 * ログレベルの優先順位
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.ERROR]: 3,
    [LogLevel.WARN]: 2,
    [LogLevel.INFO]: 1,
    [LogLevel.DEBUG]: 0,
};

/**
 * ログエントリー - 構造化されたログデータ
 */
export interface LogEntry {
    /** タイムスタンプ (ISO 8601形式) */
    timestamp: string;
    /** ログレベル */
    level: LogLevel;
    /** ログメッセージ */
    message: string;
    /** コンテキスト情報 */
    context?: Record<string, unknown>;
    /** エラー情報 */
    error?: {
        message: string;
        stack?: string;
        name?: string;
    };
    /** 環境情報 */
    environment: string;
    /** アプリケーション名 */
    application: string;
}

/**
 * ログ出力先インターフェース
 */
interface LogTransport {
    /** ログを出力 */
    log(entry: LogEntry): void;
}

/**
 * コンソールログ出力
 */
class ConsoleTransport implements LogTransport {
    log(entry: LogEntry): void {
        const { level, timestamp, message, context, error } = entry;

        // 開発環境では見やすい形式で出力
        if (process.env.NODE_ENV === 'development') {
            const emoji = this.getEmoji(level);
            const colorFn = this.getColorFunction(level);

            console[this.getConsoleMethod(level)](
                `${emoji} [${timestamp}] ${colorFn(level.toUpperCase())}: ${message}`,
                context && Object.keys(context).length > 0 ? context : '',
                error ? `\n${error.stack || error.message}` : ''
            );
        } else {
            // 本番環境ではJSON形式で出力
            console[this.getConsoleMethod(level)](JSON.stringify(entry));
        }
    }

    private getEmoji(level: LogLevel): string {
        switch (level) {
            case LogLevel.ERROR:
                return '❌';
            case LogLevel.WARN:
                return '⚠️';
            case LogLevel.INFO:
                return 'ℹ️';
            case LogLevel.DEBUG:
                return '🔍';
            default:
                return '📝';
        }
    }

    private getColorFunction(level: LogLevel): (text: string) => string {
        // 本番環境では色付けしない
        if (process.env.NODE_ENV === 'production') {
            return (text: string) => text;
        }

        // 開発環境では色付け（ANSIエスケープコード）
        const colors = {
            [LogLevel.ERROR]: '\x1b[31m', // 赤
            [LogLevel.WARN]: '\x1b[33m',  // 黄
            [LogLevel.INFO]: '\x1b[36m',  // シアン
            [LogLevel.DEBUG]: '\x1b[90m', // グレー
        };
        const reset = '\x1b[0m';

        return (text: string) => `${colors[level]}${text}${reset}`;
    }

    private getConsoleMethod(level: LogLevel): 'error' | 'warn' | 'log' {
        switch (level) {
            case LogLevel.ERROR:
                return 'error';
            case LogLevel.WARN:
                return 'warn';
            default:
                return 'log';
        }
    }
}

/**
 * ロガークラス
 */
export class Logger {
    private transports: LogTransport[] = [];
    private minLevel: LogLevel;
    private baseContext: Record<string, unknown>;
    private application: string;
    private environment: string;

    constructor(options?: {
        minLevel?: LogLevel;
        context?: Record<string, unknown>;
        application?: string;
        environment?: string;
        transports?: LogTransport[];
    }) {
        this.minLevel = options?.minLevel || this.getDefaultLogLevel();
        this.baseContext = options?.context || {};
        this.application = options?.application || 'CMS';
        this.environment = options?.environment || process.env.NODE_ENV || 'development';
        this.transports = options?.transports || [new ConsoleTransport()];
    }

    /**
     * デフォルトのログレベルを取得
     */
    private getDefaultLogLevel(): LogLevel {
        const envLevel = process.env.LOG_LEVEL?.toLowerCase();

        switch (envLevel) {
            case 'error':
                return LogLevel.ERROR;
            case 'warn':
                return LogLevel.WARN;
            case 'info':
                return LogLevel.INFO;
            case 'debug':
                return LogLevel.DEBUG;
            default:
                return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
        }
    }

    /**
     * ログを出力すべきか判定
     */
    private shouldLog(level: LogLevel): boolean {
        return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel];
    }

    /**
     * ログエントリーを作成
     */
    private createLogEntry(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error | unknown
    ): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            context: { ...this.baseContext, ...context },
            environment: this.environment,
            application: this.application,
        };

        // エラー情報の追加
        if (error) {
            if (error instanceof Error) {
                entry.error = {
                    message: error.message,
                    name: error.name,
                    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                };
            } else {
                entry.error = {
                    message: String(error),
                };
            }
        }

        return entry;
    }

    /**
     * ログを出力
     */
    private log(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: Error | unknown
    ): void {
        if (!this.shouldLog(level)) {
            return;
        }

        const entry = this.createLogEntry(level, message, context, error);

        // 全ての出力先にログを送信
        for (const transport of this.transports) {
            try {
                transport.log(entry);
            } catch (err) {
                // トランスポートのエラーは無視（無限ループ防止）
                console.error('Logger transport error:', err);
            }
        }
    }

    /**
     * エラーログ
     */
    error(message: string, contextOrError?: Record<string, unknown> | Error, error?: Error): void {
        if (contextOrError instanceof Error) {
            this.log(LogLevel.ERROR, message, undefined, contextOrError);
        } else {
            this.log(LogLevel.ERROR, message, contextOrError, error);
        }
    }

    /**
     * 警告ログ
     */
    warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, context);
    }

    /**
     * 情報ログ
     */
    info(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.INFO, message, context);
    }

    /**
     * デバッグログ
     */
    debug(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, message, context);
    }

    /**
     * 子ロガーを作成（コンテキストを継承）
     */
    child(context: Record<string, unknown>): Logger {
        return new Logger({
            minLevel: this.minLevel,
            context: { ...this.baseContext, ...context },
            application: this.application,
            environment: this.environment,
            transports: this.transports,
        });
    }

    /**
     * トランスポートを追加
     */
    addTransport(transport: LogTransport): void {
        this.transports.push(transport);
    }

    /**
     * ログレベルを変更
     */
    setLevel(level: LogLevel): void {
        this.minLevel = level;
    }
}

/**
 * デフォルトロガーインスタンス
 */
export const logger = new Logger();

/**
 * モジュール別ロガーを作成
 */
export function createLogger(module: string, context?: Record<string, unknown>): Logger {
    return logger.child({ module, ...context });
}

/**
 * 外部ロギングサービス用トランスポート（将来の拡張用）
 */
export class ExternalLogTransport implements LogTransport {
    constructor(
        private endpoint: string,
        private apiKey?: string
    ) { }

    log(entry: LogEntry): void {
        // 本番環境でのみ外部サービスに送信
        if (process.env.NODE_ENV !== 'production') {
            return;
        }

        // 非同期で送信（エラーは無視）
        void this.sendLog(entry);
    }

    private async sendLog(entry: LogEntry): Promise<void> {
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
                },
                body: JSON.stringify(entry),
            });
        } catch (error) {
            // エラーは無視（ロギングの失敗でアプリを止めない）
            console.error('Failed to send log to external service:', error);
        }
    }
}

/**
 * パフォーマンス測定ヘルパー
 */
export class PerformanceLogger {
    private startTime: number;
    private logger: Logger;
    private operation: string;

    constructor(operation: string, context?: Record<string, unknown>) {
        this.operation = operation;
        this.logger = logger.child({ operation, ...context });
        this.startTime = Date.now();
        this.logger.debug(`${operation} started`);
    }

    /**
     * 測定を終了してログ出力
     */
    end(additionalContext?: Record<string, unknown>): void {
        const duration = Date.now() - this.startTime;
        this.logger.info(`${this.operation} completed`, {
            duration,
            durationMs: `${duration}ms`,
            ...additionalContext,
        });
    }

    /**
     * エラーで終了
     */
    error(error: Error | unknown, additionalContext?: Record<string, unknown>): void {
        const duration = Date.now() - this.startTime;
        this.logger.error(`${this.operation} failed`, {
            duration,
            durationMs: `${duration}ms`,
            ...additionalContext,
        }, error instanceof Error ? error : undefined);
    }
}

export default logger;
