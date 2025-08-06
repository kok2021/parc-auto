module.exports = {
  apps: [
    {
      name: 'autoparc-api',
      script: 'server.js',
      instances: 'max', // Utiliser tous les CPU disponibles
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Logs
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Restart policy
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Environment variables
      env_file: '.env',
      
      // Health check
      health_check_grace_period: 3000,
      
      // Cron jobs (optionnel)
      cron_restart: '0 2 * * *', // Redémarrage quotidien à 2h du matin
      
      // Advanced settings
      node_args: '--max-old-space-size=1024',
      merge_logs: true,
      
      // PM2 specific
      pmx: true,
      source_map_support: true,
      
      // Error handling
      autorestart: true,
      exp_backoff_restart_delay: 100
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/autoparc.git',
      path: '/var/www/autoparc',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'deploy',
      host: 'staging.your-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-username/autoparc.git',
      path: '/var/www/autoparc-staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
}; 