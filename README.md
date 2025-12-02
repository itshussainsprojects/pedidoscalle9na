# 🍽️ Calle Novena - Restaurant Ordering System

A complete restaurant ordering system with customer ordering, waiter management, and kitchen display.

## 🌟 Features

- **Customer Ordering**: Customers scan QR code and order from their phones
- **Waiter Console**: Waiters approve orders and manage tables
- **Kitchen Display**: Kitchen staff see orders and mark them ready
- **Real-time Updates**: All screens update automatically
- **Simple Menu Management**: Menu loaded from CSV files
- **Special Promotions**: Support for special promotions and deals

## 🖥️ Pages

1. **`/` or `/client.html`** - Customer ordering page (main homepage)
2. **`/waiter.html`** - Waiter management console
3. **`/kitchen.html`** - Kitchen display system

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 14+ installed
- npm package manager

### Installation
```bash
# Install dependencies
npm install

# Start the server
npm start
```

Visit `http://localhost:3000` in your browser.

## 📦 Production Deployment

### Namecheap Hosting (Easiest)
See **`QUICK_DEPLOY.md`** for step-by-step instructions.

### Other Hosting Options
See **`DEPLOYMENT_GUIDE.md`** for detailed deployment guide.

## 📱 How It Works

### Customer Flow
1. Customer scans QR code with table number
2. Menu loads on their phone
3. They select items and add to order
4. Fill in name, comments, allergies
5. Submit order to waiter

### Waiter Flow
1. See pending orders
2. Review order details
3. Approve and send to kitchen
4. Mark as delivered when served

### Kitchen Flow
1. See incoming orders from waiters
2. Prepare the food
3. Mark order as ready
4. Waiter picks up and delivers

## 🔧 Configuration

Edit `.env` file:
```
PORT=3000                    # Server port
WAITER_PIN=1234             # PIN for waiter access
KITCHEN_PIN=5678            # PIN for kitchen access
TABLES_MAX=40               # Number of tables
DB_PATH=./data/calle_novena.db
```

## 📋 Menu Management

### Update Menu
Edit `data/menu.csv` with your menu items:
```csv
item_id,name_es,category,notes_kitchen
pollo_1_4,Pollo 1/4,Platos fuertes,Incluye 2 guarniciones
```

### Add Promotions
Edit `data/promotions.json`:
```json
[
  {
    "item_id": "promo_1",
    "name_es": "Combo Familiar",
    "category": "Promociones",
    "notes_kitchen": "Pollo entero + 4 guarniciones",
    "active": true
  }
]
```

Then restart the server.

## 🗂️ Project Structure

```
.
├── data/                   # Database and menu files
│   ├── menu.csv           # Main menu items
│   ├── promotions.json    # Special promotions
│   └── calle_novena.db    # SQLite database
├── public/                # Frontend files
│   ├── client.html        # Customer ordering page
│   ├── waiter.html        # Waiter console
│   ├── kitchen.html       # Kitchen display
│   └── styles.css         # Shared styles
├── models/                # Database models
├── routes/                # API routes
├── tools/                 # Utility scripts
├── server.js             # Main server file
├── db.js                 # Database connection
└── .env                  # Configuration
```

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (node:sqlite)
- **Frontend**: Vanilla JavaScript + HTML/CSS
- **Real-time**: Polling (5-second intervals)

## 📝 Available Scripts

```bash
npm start              # Start the server
npm run dev            # Start in development mode
npm run import-menu    # Import menu from CSV
npm run pm2:start      # Start with PM2 (production)
npm run pm2:restart    # Restart PM2 process
npm run pm2:stop       # Stop PM2 process
```

## 🔒 Security Notes

1. Change default PINs in `.env` file
2. Use HTTPS in production (SSL certificate)
3. Regular backups of database file
4. Keep Node.js and dependencies updated

## 📞 Support

For deployment issues, check:
- `QUICK_DEPLOY.md` - Quick deployment steps
- `DEPLOYMENT_GUIDE.md` - Detailed deployment guide

## 📄 License

Private project for Calle Novena restaurant.

---

**Made with ❤️ for Calle Novena**
