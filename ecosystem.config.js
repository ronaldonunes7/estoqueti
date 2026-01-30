module.exports = {
  apps: [
    {
      name: 'inventario-ti-api',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        JWT_SECRET: process.env.JWT_SECRET || 'sua-chave-secreta-super-segura-producao-inventario-ti-2026'
      },
      error_file: 'C:\\logs\\inventario-ti\\api-error.log',
      out_file: 'C:\\logs\\inventario-ti\\api-out.log',
      log_file: 'C:\\logs\\inventario-ti\\api-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 8000,
      shutdown_with_message: true,
      wait_ready: true,
      // Configurações específicas para Windows
      windowsHide: true,
      // Configurações de monitoramento
      monitoring: false,
      pmx: false,
      // Configurações de cluster
      instance_var: 'INSTANCE_ID',
      // Configurações de logs avançadas
      log_type: 'json',
      // Configurações de performance
      node_args: '--max-old-space-size=2048'
    }
  ],

  // Configurações de deploy (opcional)
  deploy: {
    production: {
      user: 'administrator',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:seu-usuario/inventario-ti.git',
      path: 'C:\\apps\\inventario-ti',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};