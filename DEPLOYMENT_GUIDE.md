# Calle Novena - Production Deployment Guide

## 🚀 Hosting on Namecheap (cPanel)

### Prerequisites
- Namecheap hosting with cPanel access
- Domain name configured
- SSH access enabled (optional but recommended)

---

## Method 1: Deploy via cPanel File Manager (Easiest)

### Step 1: Prepare Your Files
1. Create a ZIP file of your entire project folder
2. Exclude `node_modules` folder from the ZIP

### Step 2: Upload to cPanel
1. Login to your Namecheap cPanel
2. Go to **File Manager**
3. Navigate to `public_html` folder (or your domain's folder)
4. Upload the ZIP file
5. Extract the ZIP file

### Step 3: Install Node.js Dependencies
1. In cPanel, go to **Terminal** (or use SSH)
2. Navigate to your project folder:
   ```bash
   cd public_html
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Step 4: Setup Node.js Application (cPanel)
1. In cPanel, find **Setup Node.js App**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: Select latest (18.x or higher)
   - **Application mode**: Production
   - **Application root**: `/public_html` (or your folder)
   - **Application URL**: Your domain
   - **Application startup file**: `server.js`
   - **Environment variables**: Add from your `.env` file
4. Click **Create**

### Step 5: Start the Application
1. After creating, click **Run NPM Install**
2. Then click **Restart** to start your app
3. Your app should now be live at your domain!

---

## Method 2: Deploy via SSH (Recommended for Advanced Users)

### Step 1: Connect via SSH
```bash
ssh yourusername@yourdomain.com
```

### Step 2: Navigate to Web Directory
```bash
cd public_html
```

### Step 3: Clone or Upload Your Project
If using Git:
```bash
git clone <your-repository-url> .
```

Or upload via FTP/SFTP using FileZilla.

### Step 4: Install Dependencies
```bash
npm install --production
```

### Step 5: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Step 6: Start Application with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 7: Configure Apache/Nginx Reverse Proxy
You'll need to setup a proxy to forward requests from port 80/443 to 3000.

In cPanel, add this to `.htaccess` in your domain root:
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## Important URLs After Deployment

- **Main Page (Customer Orders)**: `https://yourdomain.com/`
- **Waiter Console**: `https://yourdomain.com/waiter.html`
- **Kitchen Display**: `https://yourdomain.com/kitchen.html`
- **API Menu**: `https://yourdomain.com/api/menu`

---

## Post-Deployment Checklist

- [ ] Test the main customer page
- [ ] Test placing an order
- [ ] Test waiter console
- [ ] Test kitchen display
- [ ] Check that orders flow correctly: Customer → Waiter → Kitchen
- [ ] Test on mobile devices
- [ ] Setup SSL certificate (free via cPanel Let's Encrypt)
- [ ] Configure domain DNS properly
- [ ] Test with different table numbers

---

## Troubleshooting

### App not starting?
- Check Node.js version (should be 14+ or higher)
- Check logs in cPanel: Terminal → `pm2 logs` or check error logs
- Verify all environment variables are set correctly

### Port issues?
- Make sure your app uses the PORT from environment variable
- In cPanel, Node.js apps typically run on assigned ports, not 3000

### Database errors?
- Ensure `data` folder has write permissions
- Check that `calle_novena.db` can be created/accessed

### Can't access pages?
- Clear browser cache
- Check `.htaccess` configuration
- Verify file permissions (755 for folders, 644 for files)

---

## Monitoring & Maintenance

### Check Application Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs calle-novena
```

### Restart Application
```bash
pm2 restart calle-novena
# OR
npm run pm2:restart
```

### Stop Application
```bash
pm2 stop calle-novena
```

---

## Security Recommendations

1. **Change default PINs** in `.env` file:
   - `WAITER_PIN` 
   - `KITCHEN_PIN`

2. **Enable HTTPS** via cPanel SSL/TLS

3. **Regular backups** of database file in `data/calle_novena.db`

4. **Update dependencies** regularly:
   ```bash
   npm update
   ```

---

## Support

If you encounter issues:
1. Check Namecheap support documentation
2. Check cPanel error logs
3. Check application logs: `pm2 logs`
4. Contact Namecheap support for server-specific issues

---

**Good luck with your deployment! 🎉**
