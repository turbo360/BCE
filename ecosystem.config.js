module.exports = {
  apps: [{
    name: 'bce-casestudies',
    script: 'node_modules/.bin/next',
    args: 'start -p 3001',
    cwd: '/var/www/bce.turbo.net.au',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOSTNAME: '127.0.0.1',
    },
  }],
};
