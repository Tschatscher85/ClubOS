// PM2 Ecosystem Config - Vereinbase
// Start: npx pm2 start ecosystem.config.js
// Status: npx pm2 status
// Logs: npx pm2 logs
// Restart: npx pm2 restart all
// Stop: npx pm2 stop all

module.exports = {
  apps: [
    {
      name: 'vereinbase-backend',
      cwd: './apps/backend',
      script: 'dist/main.js',
      node_args: '--max-old-space-size=512',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/tmp/vereinbase-backend-error.log',
      out_file: '/tmp/vereinbase-backend-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'vereinbase-frontend',
      cwd: './apps/frontend',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/tmp/vereinbase-frontend-error.log',
      out_file: '/tmp/vereinbase-frontend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
