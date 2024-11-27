const express = require('express');
const SensorData = require('../models/Sensor');
const router = express.Router();

// Lấy tất cả dữ liệu cảm biến
router.get('/', async (req, res) => {
    const data = await SensorData.find().sort({ timestamp: -1 });
    res.json(data);
});

// Xóa dữ liệu cảm biến cũ hơn 7 ngày
router.delete('/old', async (req, res) => {
    const result = await SensorData.deleteMany({ timestamp: { $lt: Date.now() - 7 * 24 * 60 * 60 * 1000 } });
    res.json({ deletedCount: result.deletedCount });
});

module.exports = router;
