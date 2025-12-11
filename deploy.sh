# Azure Web App deployment script
pm2 delete ecosystem.config.js --silent
pm2 start ecosystem.config.js --no-daemon
