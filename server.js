require('dotenv').config();

const mqtt = require('mqtt');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Định nghĩa schema cho dữ liệu cảm biến
const sensorSchema = new mongoose.Schema({
    temperature: Number,
    humidity: Number,
    timestamp: { type: Date, default: Date.now }
});

// Định nghĩa schema cho trạng thái LED
const ledSchema = new mongoose.Schema({
    led1: Boolean,
    led2: Boolean,
    timestamp: { type: Date, default: Date.now }
});

// Định nghĩa schema cho trạng thái thẻ RFID và cửa
const rfidSchema = new mongoose.Schema({
    uid: String, // UID của thẻ RFID
    doorStatus: String, // Trạng thái cửa ('open' hoặc 'close')
    timestamp: { type: Date, default: Date.now }
});

// Tạo model cho MongoDB
const SensorData = mongoose.model('SensorData', sensorSchema);
const LedData = mongoose.model('LedData', ledSchema);
const RfidData = mongoose.model('RfidData', rfidSchema); // Model cho RFID và cửa

// Kết nối đến MQTT Broker
const client = mqtt.connect(process.env.MQTT_BROKER, {
    port: process.env.MQTT_PORT,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});

// Khi kết nối thành công
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Subscribe tới các topic 'home/sensor', 'home/led1', 'home/led2', 'home/door'
    client.subscribe(['home/sensor', 'home/led1', 'home/led2', 'home/door']);
});

// Khi nhận được tin nhắn từ các topic
client.on('message', (topic, message) => {
    let payload;

    try {
        // Cố gắng parse message nếu nó là JSON
        payload = JSON.parse(message.toString());
    } catch (error) {
        // Nếu message không phải là JSON, gán trực tiếp giá trị từ message
        payload = message.toString();
    }

    if (topic === 'home/sensor') {
        console.log('Received sensor data:', payload);

        if (typeof payload === 'object') {
            // Lưu dữ liệu cảm biến vào MongoDB nếu payload là object
            const newSensorData = new SensorData({
                temperature: payload.temperature,
                humidity: payload.humidity
            });

            newSensorData.save()
                .then(() => console.log('Sensor data saved to MongoDB'))
                .catch(err => console.log('Error saving sensor data:', err));
        } else {
            console.log('Invalid sensor data format');
        }

    } else if (topic === 'home/led1' || topic === 'home/led2') {
        console.log(`Received ${topic} data:`, payload);

        // Kiểm tra nếu payload là 'on' hoặc 'off'
        if (payload === 'on' || payload === 'off') {
            const ledState = payload === 'on';

            // Lưu hoặc cập nhật trạng thái LED trong MongoDB
            LedData.findOneAndUpdate({}, {
                [topic === 'home/led1' ? 'led1' : 'led2']: ledState,
                timestamp: Date.now()
            }, { upsert: true, new: true })
                .then(() => console.log('LED data updated in MongoDB'))
                .catch(err => console.log('Error updating LED data:', err));
        } else {
            console.log('Invalid LED data format');
        }

    } else if (topic === 'home/door') {
        console.log('Received door control data:', payload);

        // Xử lý trạng thái cửa (mở/đóng) và lưu vào MongoDB
        if (payload === 'open' || payload === 'close') {
            const doorStatus = payload;

            // Lưu trạng thái cửa và UID của thẻ
            const newRfidData = new RfidData({
                uid: 'DEADBEEF', // Thay thế bằng UID nhận được từ Arduino (giả sử ở đây là chuỗi UID)
                doorStatus: doorStatus
            });

            newRfidData.save()
                .then(() => console.log('RFID and door status saved to MongoDB'))
                .catch(err => console.log('Error saving RFID data:', err));
        } else {
            console.log('Invalid door control data format');
        }
    }
});

// Tạo server Express để xem dữ liệu cảm biến và trạng thái LED
const app = express();
app.use(bodyParser.json());

// Route để xem tất cả dữ liệu cảm biến đã lưu
app.get('/api/sensor-data', async (req, res) => {
    try {
        const data = await SensorData.find();
        res.json(data);
    } catch (err) {
        res.status(500).send('Error retrieving sensor data');
    }
});

// Route để xem trạng thái của LED
app.get('/api/led-data', async (req, res) => {
    try {
        const ledData = await LedData.findOne();
        res.json(ledData);
    } catch (err) {
        res.status(500).send('Error retrieving LED data');
    }
});

// Route để xem dữ liệu RFID và trạng thái cửa
app.get('/api/rfid-data', async (req, res) => {
    try {
        const rfidData = await RfidData.find();
        res.json(rfidData);
    } catch (err) {
        res.status(500).send('Error retrieving RFID data');
    }
});

// Khởi động server
const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
