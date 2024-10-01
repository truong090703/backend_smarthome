const mqtt = require('mqtt'); // Thư viện MQTT
const mongoose = require('mongoose'); // Thư viện MongoDB
const express = require('express'); // Thư viện Express
const bodyParser = require('body-parser'); // Để xử lý JSON body trong request

// Kết nối đến MongoDB
mongoose.connect('mongodb://localhost:27017/smart-home', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
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

// Tạo model cho MongoDB
const SensorData = mongoose.model('SensorData', sensorSchema);
const LedData = mongoose.model('LedData', ledSchema);

// Kết nối đến MQTT Broker
const client = mqtt.connect('mqtts://bca5208c07354d41b2ec65c6f6ad9f36.s1.eu.hivemq.cloud', {
    port: 8883,
    username: 'truong0907',
    password: 'Truong123'
});

// Khi kết nối thành công
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    // Subscribe tới các topic 'home/sensor', 'home/led1', 'home/led2'
    client.subscribe(['home/sensor', 'home/led1', 'home/led2']);
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


const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
