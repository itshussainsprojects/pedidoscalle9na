# 🚀 MongoDB Setup & Deployment Guide

## ✅ **WHAT'S BEEN DONE:**

### **Complete MongoDB Migration:**
1. ✅ Added `mongoose` package
2. ✅ Created MongoDB connection module (`config/database.js`)
3. ✅ Created Order model with full CRUD (`models/Order.js`)
4. ✅ Updated ALL server endpoints to use MongoDB
5. ✅ Replaced RAM storage with persistent database
6. ✅ All pages work EXACTLY the same (no UI changes!)

---

## 📋 **SETUP STEPS:**

### **STEP 1: Install Dependencies** (1 minute)

```bash
cd "c:\Users\Dell\OneDrive\Documents\Downloads\versioin 2.0\BACKUP"
npm install
```

This installs `mongoose` package.

---

### **STEP 2: Setup MongoDB Atlas** (10 minutes)

#### **2.1: Create Account**
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up (FREE)
3. Verify email

#### **2.2: Create Cluster**
1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select **AWS** provider
4. Choose region closest to you (e.g., US East)
5. Cluster Name: `calle-novena` (or any name)
6. Click **"Create"**
7. Wait 3-5 minutes for cluster to deploy

#### **2.3: Create Database User**
1. Click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `calle-novena-user` (or any name)

5. Password: julian1234@  → **COPY IT!**
6. Database User Privileges: **"Atlas admin"**
7. Click **"Add User"**

#### **2.4: Whitelist IP**
1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

#### **2.5: Get Connection String**
1. Click **"Database"** (left sidebar)
2. Click **"Connect"** button on your cluster
3. Click **"Drivers"**
4. Select **"Node.js"** driver
5. Copy the connection string (looks like):
   ```
   mongodb+srv://calle-novena-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace `<password>`** with your actual password (from step 2.3)
7. Add database name: `/calle-novena` before the `?`
   
   **Final string:**
   ```
   mongodb+srv://calle-novena-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/calle-novena?retryWrites=true&w=majority
   ```

---

### **STEP 3: Update .env File** (1 minute)

Open `.env` file and update the `MONGODB_URI`:

```env
MONGODB_URI=mongodb+srv://calle-novena-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/calle-novena?retryWrites=true&w=majority
```

**Replace with YOUR actual connection string from Step 2.5!**

---

### **STEP 4: Test Locally** (5 minutes)

```bash
npm start
```

**You should see:**
```
✅ MongoDB Connected: cluster0-shard-00-00.xxxxx.mongodb.net
📊 Database: calle-novena
[MENU] Loaded 64 items from CSV
[MENU] Loaded 4 promotions from promotions.json
[MENU] Final menu ready: 64 base items + 4 promos
Servidor escuchando en http://localhost:3000
Environment: production
Process ID: xxxxx
```

**If you see ✅ MongoDB Connected → SUCCESS!**

---

### **STEP 5: Test All Features** (10 minutes)

#### **Test 1: Client Page**
1. Open: `http://localhost:3000/`
2. Enter table number: `5`
3. Add some menu items
4. Fill in name, comments
5. Click **"Enviar pedido al mesero"**
6. Should show success message ✅

#### **Test 2: Waiter Page**
1. Open: `http://localhost:3000/waiter.html`
2. Should see your order in **"Pedidos por aprobar"** ✅
3. Click **"Enviar a cocina"**
4. Order moves to **"Pedidos enviados a cocina"** ✅

#### **Test 3: Kitchen Page**
1. Open: `http://localhost:3000/kitchen.html`
2. Should see order in **"Pedidos en preparación"** ✅
3. Click **"Marcar listo"**
4. Order moves to **"Pedidos listos"** ✅

#### **Test 4: Back to Waiter**
1. Go back to waiter page
2. Order should be in **"Pedidos listos / entregados"** ✅
3. Click **"Marcar entregado"**
4. Order status changes to "Entregado" ✅

#### **Test 5: Data Persistence**
1. **Stop the server** (Ctrl+C)
2. **Start again**: `npm start`
3. Refresh pages
4. **Orders should still be there!** ✅ (This proves MongoDB works!)

---

## 🌐 **DEPLOY TO VERCEL:**

### **STEP 6: Prepare for Vercel** (2 minutes)

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

### **STEP 7: Push to GitHub** (5 minutes)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "MongoDB migration complete"

# Create GitHub repo (go to github.com → New Repository)
# Then:
git remote add origin https://github.com/YOUR_USERNAME/calle-novena.git
git branch -M main
git push -u origin main
```

---

### **STEP 8: Deploy to Vercel** (5 minutes)

#### **8.1: Import Project**
1. Go to: https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Framework Preset: **"Other"**
5. **DO NOT** change anything in Build settings

#### **8.2: Add Environment Variable**
1. Before deploying, click **"Environment Variables"**
2. Add:
   - **Name**: `MONGODB_URI`
   - **Value**: `mongodb+srv://calle-novena-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/calle-novena?retryWrites=true&w=majority`
   - **Environments**: Select **Production**, **Preview**, **Development**
3. Click **"Add"**

#### **8.3: Deploy**
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Done! 🎉

---

### **STEP 9: Test Live** (5 minutes)

Your app will be at: `https://your-project-name.vercel.app`

**Test:**
1. Open: `https://your-project-name.vercel.app/`
2. Submit order
3. Check waiter page: `https://your-project-name.vercel.app/waiter.html`
4. Check kitchen page: `https://your-project-name.vercel.app/kitchen.html`

**All should work perfectly!** ✅

---

## 📊 **WHAT'S CHANGED (Technical):**

### **Before (RAM Storage):**
```javascript
let orders = []; // In-memory
// Server restart = data lost!
```

### **After (MongoDB):**
```javascript
const Order = require('./models/Order');
await order.save(); // Persistent!
// Server restart = data safe!
```

---

## 🎯 **FULL CRUD OPERATIONS:**

### **CREATE:**
```javascript
POST /api/orders
// Creates new order in MongoDB
```

### **READ:**
```javascript
GET /api/orders                  // All orders
GET /api/orders/pending-waiter   // Pending for waiter
GET /api/orders/in-kitchen       // In kitchen
GET /api/orders/ready            // Ready/delivered
```

### **UPDATE:**
```javascript
POST /api/orders/:id/send-to-kitchen  // Status: pending → in_kitchen
POST /api/orders/:id/mark-ready       // Status: in_kitchen → ready
POST /api/orders/:id/mark-delivered   // Status: ready → delivered
```

### **DELETE:** 
Currently not implemented (orders are kept for history).
Can add later if needed!

---

## ✅ **VERIFICATION CHECKLIST:**

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelisted (0.0.0.0/0)
- [ ] Connection string copied
- [ ] `.env` updated with MONGODB_URI
- [ ] `npm install` completed
- [ ] Local test successful
- [ ] All pages tested
- [ ] Data persists after restart
- [ ] GitHub repo created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variable added
- [ ] Deployed successfully
- [ ] Live site tested

---

## 🚨 **TROUBLESHOOTING:**

### **Error: "MongoDB connection FAILED"**
**Solution:**
1. Check MONGODB_URI in `.env` is correct
2. Make sure password has no special characters (or URL-encode them)
3. Verify IP is whitelisted in MongoDB Atlas
4. Check internet connection

### **Error: "MongooseError: Operation buffering timed out"**
**Solution:**
1. Check MongoDB Atlas cluster is running (not paused)
2. Verify network connection
3. Check firewall settings

### **Orders not showing after server restart:**
**Solution:**
- This means MongoDB is NOT connected
- Check console for "✅ MongoDB Connected" message
- If not showing, fix connection string

### **Vercel deployment fails:**
**Solution:**
1. Make sure `vercel.json` exists
2. Check environment variable is added in Vercel dashboard
3. Check build logs for errors

---

## 📞 **NEED HELP?**

If stuck:
1. Check MongoDB Atlas dashboard - is cluster running?
2. Check `.env` file - is MONGODB_URI correct?
3. Check Vercel dashboard - is environment variable set?
4. Check browser console for errors
5. Check server logs for errors

---

## 🎉 **SUCCESS INDICATORS:**

**You'll know it's working when:**
1. ✅ Console shows "MongoDB Connected"
2. ✅ Orders appear in all pages
3. ✅ Orders persist after server restart
4. ✅ All buttons work (send to kitchen, mark ready, etc.)
5. ✅ Multiple devices see same data
6. ✅ Vercel deployment successful

---

**Good luck! Everything is ready to go! 🚀**
