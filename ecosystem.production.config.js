module.exports = {
  apps: [
    {
      name: 'test-website-production',
      script: 'npm',
      args: 'start',
      instances: 'max', // 利用可能なCPUコア数に応じて自動スケール
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // ログ設定
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      combine_logs: true,
      // 起動時の設定
      listen_timeout: 10000,
      kill_timeout: 5000,
      // ヘルスチェック
      min_uptime: '10s',
      max_restarts: 10,
    }
  ],

  deploy: {
    production: {
      user: 'coreserver',
      host: 'your-server.com',
      ref: 'origin/master',
      repo: 'git@github.com:jungamer-64/test-website.git',
      path: '/home/coreserver/test-website',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.production.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
