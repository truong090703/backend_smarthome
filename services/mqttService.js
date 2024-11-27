const mqtt = require('mqtt');
const SensorData = require('../models/Sensor');
const LedData = require('../models/Led');
const RfidData = require('../models/Rfid');

// Kết nối MQTT
const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe(['home/sensor', 'home/led1', 'home/led2', 'home/door']);
});

client.on('message', async (topic, message) => {
    let payload;
    try {
        payload = JSON.parse(message.toString());
    } catch (err) {
        payload = message.toString();
    }

    if (topic === 'home/sensor') {
        if (typeof payload === 'object') {
            await SensorData.create({
                temperature: payload.temperature,
                humidity: payload.humidity
            });
            console.log('Sensor data saved');
        }
    } else if (topic === 'home/led1' || topic === 'home/led2') {
        const ledState = payload === 'on';
        const field = topic === 'home/led1' ? 'led1' : 'led2';
        await LedData.findOneAndUpdate({}, { [field]: ledState, timestamp: Date.now() }, { upsert: true });
        console.log('LED data updated');
    } else if (topic === 'home/door') {
        if (payload === 'open' || payload === 'close') {
            await RfidData.create({ uid: 'DEADBEEF', doorStatus: payload });
            console.log('Door data saved');
        }
    }
});

module.exports = client;
