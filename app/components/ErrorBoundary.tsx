'use client';

import Link from 'next/link';
import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
    /** エラー時に表示するフォールバックUI（オプション） */
    readonly fallback?: ReactNode;
    /** エラー発生時のコールバック */
    readonly onError?: (error: Error, errorInfo: ErrorInfo) => void;
    /** リセット時のコールバック */
    readonly onReset?: () => void;
    /** 子要素 */
    readonly children: ReactNode;
}

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * React Error Boundary コンポーネント
 *
 * クライアントサイドで発生したエラーをキャッチし、
 * ユーザーにフレンドリーなエラーメッセージを表示します。
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error, errorInfo) => {
 *     logErrorToService(error, errorInfo);
 *   }}
 * >
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    /**
     * エラーが発生したときに呼ばれる
     */
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    /**
     * エラー情報をキャッチしてログに記録
     */
    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // コンソールにエラーログを出力
        console.error('[Error Boundary] Error caught:', error);
        console.error('[Error Boundary] Error Info:', errorInfo);

        // 状態を更新
        this.setState({
            error,
            errorInfo,
        });

        // 親コンポーネントからのコールバックを実行
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // TODO: 将来的には外部ロギングサービスに送信
        // logErrorToService(error, errorInfo);
    }

    /**
     * エラーをリセットして再試行
     */
    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });

        // 親コンポーネントからのリセットコールバックを実行
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    /**
     * ページをリロード
     */
    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // カスタムフォールバックUIが提供されている場合
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // デフォルトのエラーUI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
                            <svg
                                className="w-6 h-6 text-red-600 dark:text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-2">
                            エラーが発生しました
                        </h2>

                        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                            申し訳ございません。予期しないエラーが発生しました。
                            ページを再読み込みするか、しばらく経ってから再度お試しください。
                        </p>

                        {/* 開発環境でのみエラー詳細を表示 */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                <h3 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2">
                                    エラー詳細 (開発環境のみ):
                                </h3>
                                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && (
                                        <>
                                            {'\n\n'}
                                            {this.state.errorInfo.componentStack}
                                        </>
                                    )}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            >
                                再試行
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            >
                                ページを再読み込み
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <Link
                                href="/"
                                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                            >
                                ホームに戻る
                            </Link>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * カスタムフォールバックUI用のヘルパーコンポーネント
 */
export function ErrorFallback({
    error,
    resetError,
}: {
    error: Error;
    resetError: () => void;
}): ReactNode {
    return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                エラーが発生しました
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">{error.message}</p>
            <button
                onClick={resetError}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
            >
                再試行
            </button>
        </div>
    );
}

export default ErrorBoundary;
