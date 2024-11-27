const mongoose = require('mongoose');

const ledSchema = new mongoose.Schema({
    led1: Boolean,
    led2: Boolean,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LedData', ledSchema);
