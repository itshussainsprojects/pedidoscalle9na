#!/bin/bash
# PM2 Health Check and Auto-Restart Script
# Run this via cron every 5 minutes: */5 * * * * /path/to/pm2-health-check.sh

APP_NAME="calle-novena"
APP_DIR="/home/pedickgg/public_html/my-app"

cd $APP_DIR

# Check if PM2 is running
if ! command -v pm2 &> /dev/null; then
    echo "PM2 not found, installing..."
    npm install -g pm2
fi

# Check app status
STATUS=$(pm2 jlist | grep -c "\"name\":\"$APP_NAME\"")

if [ "$STATUS" -eq 0 ]; then
    echo "App not running, starting..."
    pm2 start ecosystem.config.js
    pm2 save
else
    # Check if app is errored
    ERRORED=$(pm2 jlist | grep "\"name\":\"$APP_NAME\"" | grep -c "\"status\":\"errored\"")
    
    if [ "$ERRORED" -gt 0 ]; then
        echo "App in error state, restarting..."
        pm2 restart $APP_NAME
    fi
    
    # Check if app is stopped
    STOPPED=$(pm2 jlist | grep "\"name\":\"$APP_NAME\"" | grep -c "\"status\":\"stopped\"")
    
    if [ "$STOPPED" -gt 0 ]; then
        echo "App stopped, starting..."
        pm2 start $APP_NAME
    fi
fi

# Clean up old logs (keep last 7 days)
find $APP_DIR/logs -name "*.log" -type f -mtime +7 -delete

echo "Health check completed at $(date)"
