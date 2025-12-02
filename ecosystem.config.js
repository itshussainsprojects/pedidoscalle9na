module.exports = {
  apps: [{
    name: 'calle-novena',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    // Lower memory limit for shared hosting
    max_memory_restart: '256M',
    min_uptime: '5s',
    max_restarts: 15,
    restart_delay: 2000,
    // Disable file logging to save resources
    error_file: '/dev/null',
    out_file: '/dev/null',
    merge_logs: true,
    // Lower priority to avoid being killed
    node_args: '--max-old-space-size=256',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    kill_timeout: 3000,
    listen_timeout: 5000,
    shutdown_with_message: false,
    // Exponential backoff for restarts
    exp_backoff_restart_delay: 100
  }]
};
