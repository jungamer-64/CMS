module.exports = {
  apps: [
    {
      name: 'test-website',
      script: 'pnpm',
      args: 'start',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      // ログ設定
      log_type: 'json',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      combine_logs: true,
      // クラスター設定（必要に応じてinstancesを'max'に変更）
      exec_mode: 'fork',
      // 起動時の遅延
      listen_timeout: 8000,
      kill_timeout: 5000,
    }
  ],

  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/master',
      repo: 'git@github.com:jungamer-64/test-website.git',
      path: '/var/www/production',
      'pre-deploy-local': '',
      'post-deploy': 'pnpm install && pnpm run build && pm2 reload ecosystem.config.js --env production',
      // 注意: 開発環境では 'pnpm dev' でTurbopackが使用されますが、
      // プロダクションビルドは従来通りWebpackが使用されます
      'pre-setup': ''
    }
  }
};
