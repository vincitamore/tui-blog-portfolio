module.exports = {
  apps: [
    {
      name: 'tui-blog-api',
      script: 'server/api.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      cwd: '/var/www/tui-blog',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/www/tui-blog/logs/api-error.log',
      out_file: '/var/www/tui-blog/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

