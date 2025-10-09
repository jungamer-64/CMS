/**
 * ヘルスチェックエンドポイント
 *
 * システムの稼働状況を監視するためのエンドポイント
 * - データベース接続
 * - 基本的なシステム情報
 * - アプリケーションステータス
 */

import { logger, PerformanceLogger } from '@/app/lib/core/logger';
import { connectToDatabase } from '@/app/lib/database/connection';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface HealthCheckResult {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: {
            status: 'ok' | 'error';
            latency?: number;
            error?: string;
        };
        memory: {
            status: 'ok' | 'warning' | 'critical';
            used: number;
            total: number;
            percentage: number;
        };
        environment: {
            nodeEnv: string;
            nodeVersion: string;
        };
    };
}

/**
 * データベース接続チェック
 */
async function checkDatabase(): Promise<{
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
}> {
    const perfLogger = new PerformanceLogger('database-health-check');

    try {
        const startTime = Date.now();
        const db = await connectToDatabase();

        // 簡単なクエリでデータベースの応答を確認
        await db.admin().ping();

        const latency = Date.now() - startTime;
        perfLogger.end({ latency });

        return {
            status: 'ok',
            latency,
        };
    } catch (error) {
        perfLogger.error(error);
        logger.error('Database health check failed', { error });

        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown database error',
        };
    }
}

/**
 * メモリ使用状況チェック
 */
function checkMemory(): {
    status: 'ok' | 'warning' | 'critical';
    used: number;
    total: number;
    percentage: number;
} {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    let status: 'ok' | 'warning' | 'critical' = 'ok';

    if (percentage > 90) {
        status = 'critical';
        logger.warn('Memory usage critical', { percentage, used: usedMemory, total: totalMemory });
    } else if (percentage > 75) {
        status = 'warning';
        logger.warn('Memory usage high', { percentage, used: usedMemory, total: totalMemory });
    }

    return {
        status,
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(percentage * 100) / 100,
    };
}

/**
 * ヘルスチェックエンドポイント
 *
 * GET /api/health
 */
export async function GET() {
    const startTime = Date.now();

    try {
        // 各チェックを実行
        const [databaseCheck, memoryCheck] = await Promise.all([
            checkDatabase(),
            Promise.resolve(checkMemory()),
        ]);

        // 全体のステータスを判定
        let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

        if (databaseCheck.status === 'error') {
            overallStatus = 'unhealthy';
        } else if (memoryCheck.status === 'critical') {
            overallStatus = 'unhealthy';
        } else if (memoryCheck.status === 'warning') {
            overallStatus = 'degraded';
        }

        const result: HealthCheckResult = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            uptime: Math.round(process.uptime()),
            checks: {
                database: databaseCheck,
                memory: memoryCheck,
                environment: {
                    nodeEnv: process.env.NODE_ENV || 'development',
                    nodeVersion: process.version,
                },
            },
        };

        const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

        logger.info('Health check completed', {
            status: overallStatus,
            duration: Date.now() - startTime,
            databaseLatency: databaseCheck.latency,
            memoryPercentage: memoryCheck.percentage,
        });

        return NextResponse.json(result, { status: statusCode });
    } catch (error) {
        logger.error('Health check failed', { error });

        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 }
        );
    }
}
