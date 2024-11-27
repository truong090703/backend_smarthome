    const mongoose = require('mongoose');

    const rfidSchema = new mongoose.Schema({
        uid: String,
        doorStatus: String,
        timestamp: { type: Date, default: Date.now }
    });

    module.exports = mongoose.model('RfidData', rfidSchema);
