const express = require('express');
const RfidData = require('../models/Rfid');
const router = express.Router();

// Lấy dữ liệu RFID
router.get('/', async (req, res) => {
    const data = await RfidData.find().sort({ timestamp: -1 });
    res.json(data);
});

module.exports = router;
