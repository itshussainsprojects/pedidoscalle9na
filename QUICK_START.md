# ⚡ QUICK START - MongoDB Migration

## 🎯 **3 SIMPLE STEPS:**

### **1. Setup MongoDB Atlas** (10 min)
```
→ Go to: mongodb.com/atlas
→ Sign up FREE
→ Create M0 cluster
→ Create database user
→ Whitelist all IPs (0.0.0.0/0)
→ Copy connection string
```

### **2. Configure Local** (2 min)
```bash
# Install dependencies
npm install

# Update .env with your MongoDB connection string:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/calle-novena
```

### **3. Test** (3 min)
```bash
# Start server
npm start

# Look for this:
✅ MongoDB Connected: cluster0...
📊 Database: calle-novena

# Test at:
http://localhost:3000
```

---

## 🌐 **DEPLOY TO VERCEL:**

### **Quick Deploy** (10 min)
```bash
# 1. Push to GitHub
git add .
git commit -m "MongoDB migration"
git push origin main

# 2. Import to Vercel
→ vercel.com
→ New Project
→ Import from GitHub

# 3. Add Environment Variable in Vercel:
Name: MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/calle-novena

# 4. Deploy!
→ Click Deploy
→ Wait 2 minutes
→ Done! 🎉
```

---

## ✅ **WHAT WORKS:**

- ✅ All 3 pages (client, waiter, kitchen)
- ✅ Full CRUD (Create, Read, Update orders)
- ✅ Data persists (survives restarts!)
- ✅ Same UI/UX (nothing changed visually)
- ✅ Multi-device sync
- ✅ Production-ready

---

## 🔗 **YOUR MONGODB CONNECTION STRING:**

```
mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/calle-novena?retryWrites=true&w=majority
```

**Add this to:**
1. `.env` file (local)
2. Vercel Environment Variables (production)

---

## 📝 **ENDPOINTS (unchanged):**

```
POST   /api/orders                      → Create order
GET    /api/orders                      → Get all orders
GET    /api/orders/pending-waiter       → Pending orders
GET    /api/orders/in-kitchen           → Kitchen orders
GET    /api/orders/ready                → Ready orders
POST   /api/orders/:id/send-to-kitchen  → Send to kitchen
POST   /api/orders/:id/mark-ready       → Mark ready
POST   /api/orders/:id/mark-delivered   → Mark delivered
```

---

## 🎉 **DONE!**

Full guide: See `MONGODB_SETUP_GUIDE.md`
