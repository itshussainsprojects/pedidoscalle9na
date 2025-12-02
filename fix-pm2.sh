#!/bin/bash
# Quick Fix Script for PM2 503 Errors
# Upload this to your server and run: bash fix-pm2.sh

echo "========================================="
echo "PM2 Quick Fix Script"
echo "========================================="
echo ""

# Navigate to app directory
APP_DIR="/home/pedickgg/public_html/my-app"
cd $APP_DIR || exit 1

echo "✓ In directory: $(pwd)"
echo ""

# Stop all PM2 processes
echo "→ Stopping all PM2 processes..."
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
echo "✓ All PM2 processes stopped"
echo ""

# Create logs directory
echo "→ Creating logs directory..."
mkdir -p logs
chmod 755 logs
echo "✓ Logs directory ready"
echo ""

# Fix data directory permissions
echo "→ Fixing data directory permissions..."
if [ -d "data" ]; then
    chmod 755 data
    chmod 644 data/* 2>/dev/null
    echo "✓ Data permissions fixed"
else
    echo "⚠ Warning: data directory not found"
fi
echo ""

# Install/update PM2
echo "→ Checking PM2 installation..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi
pm2 update
echo "✓ PM2 is ready"
echo ""

# Start app with ecosystem file
echo "→ Starting application..."
if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js
    echo "✓ App started with ecosystem.config.js"
else
    echo "⚠ ecosystem.config.js not found, using server.js"
    pm2 start server.js --name calle-novena
fi
echo ""

# Save PM2 configuration
echo "→ Saving PM2 configuration..."
pm2 save
echo "✓ Configuration saved"
echo ""

# Setup PM2 startup
echo "→ Setting up PM2 startup script..."
pm2 startup 2>/dev/null
echo "✓ Startup script configured"
echo ""

# Show status
echo "========================================="
echo "Current Status:"
echo "========================================="
pm2 status
echo ""

# Show recent logs
echo "========================================="
echo "Recent Logs (last 30 lines):"
echo "========================================="
pm2 logs --nostream --lines 30
echo ""

# Final instructions
echo "========================================="
echo "✅ FIX COMPLETE!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs"
echo "2. Check status: pm2 status"
echo "3. Test website: curl http://localhost:3000"
echo ""
echo "If you see errors, run:"
echo "  pm2 logs --err --lines 100"
echo ""
echo "To monitor continuously:"
echo "  pm2 monit"
echo ""
