// models/Order.js
// Order model for MongoDB

const mongoose = require('mongoose');
const Counter = require('./Counter');

const OrderItemSchema = new mongoose.Schema({
  item_id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: String,
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    unique: true
  },
  table: {
    type: String,
    default: null
  },
  name: {
    type: String,
    default: null
  },
  comments: {
    type: String,
    default: null
  },
  allergies: {
    type: String,
    default: null
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending_waiter', 'in_kitchen', 'ready', 'delivered', 'cancelled'],
    default: 'pending_waiter'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  sent_to_kitchen_at: {
    type: Date,
    default: null
  },
  ready_at: {
    type: Date,
    default: null
  },
  delivered_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for faster queries
OrderSchema.index({ status: 1, created_at: -1 });
OrderSchema.index({ table: 1 });
OrderSchema.index({ created_at: -1 });
OrderSchema.index({ orderNumber: 1 });

// Auto-increment orderNumber before save
OrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.orderNumber = await Counter.getNextSequence('orderNumber');
  }
  next();
});

// Virtual for order ID (using orderNumber)
OrderSchema.virtual('id').get(function() {
  return this.orderNumber || this._id.toHexString();
});

// Ensure virtuals are included in JSON
OrderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret.orderNumber || ret._id.toHexString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', OrderSchema);
