const express = require('express');
const LedData = require('../models/Led');
const mqttClient = require('../services/mqttService');
const router = express.Router();

// Lấy trạng thái LED
router.get('/', async (req, res) => {
    const ledData = await LedData.findOne();
    res.json(ledData);
});

// Bật/tắt LED qua HTTP
router.post('/', (req, res) => {
    const { led, state } = req.body;
    const topic = led === 'led1' ? 'home/led1' : 'home/led2';
    mqttClient.publish(topic, state ? 'on' : 'off');
    res.json({ success: true });
});

module.exports = router;
