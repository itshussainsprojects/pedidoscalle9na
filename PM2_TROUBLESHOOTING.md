# 🚨 PM2 TROUBLESHOOTING - 503 ERRORS EVERY 5 MINUTES

## IMMEDIATE FIX (Run These Commands NOW)

```bash
# 1. Stop ALL PM2 processes
pm2 delete all
pm2 kill

# 2. Go to your app directory
cd /home/pedickgg/public_html/my-app

# 3. Create logs directory if it doesn't exist
mkdir -p logs

# 4. Start fresh with the ecosystem file
pm2 start ecosystem.config.js

# 5. Save the configuration
pm2 save

# 6. Enable PM2 startup on server reboot
pm2 startup

# 7. Monitor the app
pm2 logs --lines 100
```

---

## WHY THE 503 ERRORS HAPPEN

### Common Causes:
1. **App crashes** due to uncaught errors
2. **Memory leaks** causing restarts
3. **Port conflicts** (multiple instances)
4. **Database connection issues**
5. **File permission problems**
6. **PM2 not configured for auto-restart**

---

## DIAGNOSTIC COMMANDS

### Check Current Status
```bash
pm2 status
```

### View Logs (MOST IMPORTANT)
```bash
# View live logs
pm2 logs

# View last 200 lines
pm2 logs --lines 200

# View only errors
pm2 logs --err

# View specific app
pm2 logs calle-novena
```

### Check Memory Usage
```bash
pm2 monit
```

### Check PM2 Info
```bash
pm2 info calle-novena
```

### List All Processes (JSON format)
```bash
pm2 jlist
```

---

## SOLUTIONS BY SYMPTOM

### 1️⃣ App Shows "errored" Status
```bash
# View the error
pm2 logs calle-novena --err --lines 50

# Delete and restart
pm2 delete calle-novena
pm2 start ecosystem.config.js
pm2 save
```

### 2️⃣ Multiple Instances Running
```bash
# Check how many
pm2 list

# Delete all and start fresh
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

### 3️⃣ App Keeps Restarting
```bash
# Check restart count
pm2 status

# If restarts > 10, there's a crash loop
# Check logs for the error
pm2 logs --err --lines 100

# Common fixes:
# - Check database file permissions
# - Check if data folder is writable
# - Check for syntax errors in server.js
```

### 4️⃣ Port Already in Use
```bash
# Find what's using port 3000
netstat -tulpn | grep 3000

# OR on some systems
lsof -i :3000

# Kill the process
kill -9 <PID>

# Then restart PM2
pm2 restart calle-novena
```

### 5️⃣ Database Permission Errors
```bash
# Fix permissions for data directory
cd /home/pedickgg/public_html/my-app
chmod 755 data
chmod 644 data/*
chown -R pedickgg:pedickgg data

# Restart app
pm2 restart calle-novena
```

---

## PERMANENT SOLUTION: AUTO-MONITORING

### Setup Health Check Cron Job
```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * /home/pedickgg/public_html/my-app/pm2-health-check.sh >> /home/pedickgg/pm2-health.log 2>&1

# Make the script executable
chmod +x /home/pedickgg/public_html/my-app/pm2-health-check.sh
```

---

## VERIFY IT'S WORKING

### Test 1: Check PM2 Status
```bash
pm2 status
```
**Should show**: `online` status, `0` restarts (or low number)

### Test 2: Check Logs for Errors
```bash
pm2 logs --lines 50
```
**Should NOT show**: repeated errors or crash messages

### Test 3: Test the Website
```bash
curl http://localhost:3000/
curl http://localhost:3000/api/menu
```
**Should return**: HTML and JSON respectively

### Test 4: Monitor for 10 Minutes
```bash
pm2 monit
```
**Watch**: Memory should stay stable, no crashes

---

## CPANEL SPECIFIC FIXES

### If Using cPanel Node.js App Manager

1. **Stop the Node.js app in cPanel first**
2. **Then use PM2** (don't run both!)
3. **OR** configure cPanel to use PM2:
   - Application startup file: `ecosystem.config.js`
   - Application startup command: Leave blank or use `pm2-runtime start ecosystem.config.js`

### Configure Apache Proxy Correctly

Make sure `.htaccess` has:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## EMERGENCY RESTART PROCEDURE

If site goes down:
```bash
# 1. SSH into server
ssh pedickgg@server378.web-hosting.com

# 2. Navigate to app
cd /home/pedickgg/public_html/my-app

# 3. Nuclear option - kill everything and start fresh
pm2 kill
pm2 start ecosystem.config.js
pm2 save

# 4. Verify
pm2 status
pm2 logs --lines 20
```

---

## MONITORING CHECKLIST

Run these daily:
- [ ] `pm2 status` - Check app is online
- [ ] `pm2 logs --lines 50` - Check for errors
- [ ] Check website loads: `curl https://yourdomain.com`
- [ ] Check restart count (should be low)

Run these weekly:
- [ ] `pm2 logs --lines 500` - Deep dive into logs
- [ ] Backup database: `cp data/calle_novena.db data/backup-$(date +%Y%m%d).db`
- [ ] Clear old logs: `pm2 flush`
- [ ] Update dependencies: `npm update`

---

## COMMON ERROR MESSAGES & FIXES

### "EADDRINUSE: address already in use :::3000"
**Fix**: Port conflict
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart calle-novena
```

### "Cannot find module"
**Fix**: Missing dependencies
```bash
npm install
pm2 restart calle-novena
```

### "SQLITE_CANTOPEN"
**Fix**: Database permission issue
```bash
chmod 755 data
chmod 644 data/calle_novena.db
pm2 restart calle-novena
```

### "Script not found"
**Fix**: Wrong path in ecosystem.config.js
```bash
# Verify server.js exists
ls -la server.js

# Fix path in ecosystem.config.js if needed
```

---

## PERFORMANCE TUNING

### Reduce Memory Usage
In `ecosystem.config.js`, set:
```javascript
max_memory_restart: '300M',  // Restart if exceeds 300MB
```

### Limit Restarts
```javascript
max_restarts: 10,  // Stop trying after 10 restarts
min_uptime: '10s', // Must stay up 10s to count as successful start
```

### Enable Cluster Mode (if needed for high traffic)
```javascript
instances: 2,  // Run 2 instances
exec_mode: 'cluster'
```

---

## PREVENTION TIPS

1. **Never run `pm2 start server.js` multiple times** - Use `pm2 restart` instead
2. **Always use ecosystem.config.js** - Ensures consistent configuration
3. **Monitor logs regularly** - Catch issues before they cause downtime
4. **Setup automated health checks** - Use the cron job above
5. **Keep PM2 updated**: `npm install -g pm2@latest`
6. **Save PM2 config after changes**: `pm2 save`

---

## CONTACT SUPPORT

If nothing works:

1. **Collect diagnostics**:
```bash
pm2 logs --lines 500 > pm2-logs.txt
pm2 info calle-novena > pm2-info.txt
pm2 status > pm2-status.txt
```

2. **Share with hosting support**:
   - Attach the 3 files above
   - Explain the 503 error pattern
   - Mention PM2 keeps restarting

---

## FINAL CHECKLIST

Before considering it "fixed":
- [ ] `pm2 status` shows "online"
- [ ] Restart count is 0 or low
- [ ] `pm2 logs` shows no errors
- [ ] Website loads at your domain
- [ ] Let it run for 30+ minutes
- [ ] Check again - still online?
- [ ] Setup health check cron job
- [ ] Enable PM2 startup script

**If all checked ✅ - You're good to go!** 🎉
