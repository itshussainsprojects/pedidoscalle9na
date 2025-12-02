# 🚀 QUICK DEPLOYMENT STEPS FOR NAMECHEAP

## EASIEST METHOD (For Beginners)

### 1️⃣ Prepare Your Files
- [ ] Open this folder
- [ ] Delete `node_modules` folder (if exists)
- [ ] Create a ZIP file of the entire project

### 2️⃣ Login to Namecheap cPanel
- [ ] Go to your Namecheap account
- [ ] Click on "cPanel" for your hosting
- [ ] Login to cPanel

### 3️⃣ Upload Files
- [ ] In cPanel, click **File Manager**
- [ ] Navigate to `public_html` folder
- [ ] Delete everything inside (backup first if needed)
- [ ] Click **Upload** button
- [ ] Upload your ZIP file
- [ ] Right-click the ZIP → **Extract**
- [ ] Delete the ZIP file after extraction

### 4️⃣ Setup Node.js App
- [ ] In cPanel, search for **"Setup Node.js App"**
- [ ] Click **"Create Application"**
- [ ] Fill in these details:
  - **Node.js version**: 18.x or latest
  - **Application mode**: Production
  - **Application root**: `/home/yourusername/public_html`
  - **Application URL**: Leave blank (for main domain)
  - **Application startup file**: `server.js`
  - **Passenger log file**: Leave default
  
### 5️⃣ Add Environment Variables
In the Node.js App setup, scroll down to "Environment variables" and add:
```
PORT = 3000
NODE_ENV = production
DB_PATH = ./data/calle_novena.db
TABLES_MAX = 40
WAITER_PIN = 1234
KITCHEN_PIN = 5678
```

### 6️⃣ Install Dependencies & Start
- [ ] Click **"Run NPM Install"** button
- [ ] Wait for it to complete
- [ ] Click **"Restart"** button
- [ ] Your app should now be LIVE! 🎉

### 7️⃣ Setup SSL (HTTPS)
- [ ] In cPanel, go to **SSL/TLS Status**
- [ ] Click **"Run AutoSSL"** for your domain
- [ ] Wait a few minutes for SSL to activate
- [ ] Your site will now use HTTPS

### 8️⃣ Test Your App
Visit these URLs (replace `yourdomain.com` with your actual domain):
- [ ] `https://yourdomain.com/` - Should show customer ordering page ✅
- [ ] `https://yourdomain.com/waiter.html` - Waiter console
- [ ] `https://yourdomain.com/kitchen.html` - Kitchen display
- [ ] `https://yourdomain.com/api/menu` - Should return JSON menu data

---

## 🆘 TROUBLESHOOTING

### App not working?
1. Check the error log in Node.js App setup page
2. Make sure Node.js version is 14+ or higher
3. Verify all environment variables are added
4. Try clicking "Restart" again

### "Cannot GET /" error?
- This shouldn't happen anymore (we fixed it!)
- If it does, check that `server.js` has the homepage redirect

### Database errors?
1. In File Manager, right-click `data` folder
2. Click "Change Permissions"
3. Set to `755` (rwxr-xr-x)
4. Apply to all files inside

### Port conflicts?
- In cPanel Node.js setup, the port is automatically handled
- Don't worry about port 3000 - cPanel manages it

---

## 📱 WHAT YOUR CUSTOMERS WILL SEE

When customers visit **`yourdomain.com`**, they will:
1. See the ordering page automatically
2. Can select items from the menu
3. Fill in table number, name, comments
4. Send order to waiter

The flow:
**Customer** → **Waiter approves** → **Kitchen prepares** → **Waiter delivers**

---

## 🔒 SECURITY TIPS

1. **Change the PINs** in environment variables (WAITER_PIN & KITCHEN_PIN)
2. **Enable HTTPS** (SSL) - Already covered in Step 7
3. **Backup database** regularly - Download `data/calle_novena.db` weekly

---

## ✅ YOU'RE DONE!

Your restaurant ordering system is now live and ready for customers! 🎉

**Questions?** Check the full `DEPLOYMENT_GUIDE.md` for detailed explanations.
