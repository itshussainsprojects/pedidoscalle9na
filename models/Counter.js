// models/Counter.js
// Auto-increment counter for order numbers

const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

CounterSchema.statics.getNextSequence = async function(sequenceName) {
  const counter = await this.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', CounterSchema);
