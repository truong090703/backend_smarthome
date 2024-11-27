require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mqttClient = require('./services/mqttService');
const sensorRoutes = require('./routes/sensorRoutes');
const ledRoutes = require('./routes/ledRoutes');
const rfidRoutes = require('./routes/rfidRoutes');

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(bodyParser.json());

// Sử dụng các routes
app.use('/api/sensor-data', sensorRoutes);
app.use('/api/led-data', ledRoutes);
app.use('/api/rfid-data', rfidRoutes);

// Khởi động server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
