/**
 * メトリクスエンドポイント
 *
 * アプリケーションのメトリクスを収集・提供
 * - リクエスト統計
 * - パフォーマンス指標
 * - システムリソース
 */

import { logger } from '@/app/lib/core/logger';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface MetricsData {
    timestamp: string;
    system: {
        uptime: number;
        memory: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
            external: number;
        };
        cpu: {
            user: number;
            system: number;
        };
    };
    process: {
        pid: number;
        nodeVersion: string;
        platform: string;
        arch: string;
    };
    environment: {
        nodeEnv: string;
    };
}

/**
 * システムメトリクスを収集
 */
function collectSystemMetrics(): MetricsData {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
        timestamp: new Date().toISOString(),
        system: {
            uptime: Math.round(process.uptime()),
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
                rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
                external: Math.round(memoryUsage.external / 1024 / 1024), // MB
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000), // ミリ秒
                system: Math.round(cpuUsage.system / 1000), // ミリ秒
            },
        },
        process: {
            pid: process.pid,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
        },
    };
}

/**
 * メトリクスエンドポイント
 *
 * GET /api/metrics
 *
 * 注意: 本番環境では認証が必要
 */
export async function GET(request: Request) {
    try {
        // TODO: 本番環境では認証チェックを追加
        // const user = await authenticateRequest(request);
        // if (!user || user.role !== 'admin') {
        //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        // 開発環境でのみアクセス許可（本番では認証を追加）
        if (process.env.NODE_ENV === 'production') {
            const authHeader = request.headers.get('authorization');
            const expectedToken = process.env.METRICS_TOKEN;

            if (!authHeader || !expectedToken || authHeader !== `Bearer ${expectedToken}`) {
                logger.warn('Unauthorized metrics access attempt', {
                    ip: request.headers.get('x-forwarded-for') || 'unknown',
                });

                return NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                );
            }
        }

        const metrics = collectSystemMetrics();

        logger.debug('Metrics collected', {
            uptime: metrics.system.uptime,
            memoryUsage: metrics.system.memory.heapUsed,
        });

        return NextResponse.json(metrics, { status: 200 });
    } catch (error) {
        logger.error('Failed to collect metrics', { error });

        return NextResponse.json(
            {
                error: 'Failed to collect metrics',
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
