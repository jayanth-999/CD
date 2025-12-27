require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { Kafka } = require('kafkajs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
const pool = new Pool({
    user: process.env.DB_USER || 'user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'ecart',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

// Kafka Setup
const kafka = new Kafka({
    clientId: 'ecart-backend',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')]
});
const producer = kafka.producer();
let kafkaConnected = false;

// Connect to Kafka (non-blocking)
const connectKafka = async () => {
    try {
        await producer.connect();
        kafkaConnected = true;
        console.log('✅ Connected to Kafka');
    } catch (err) {
        kafkaConnected = false;
        console.error('⚠️  Kafka unavailable - running without event streaming:', err.message);
        console.log('ℹ️  App will continue without Kafka. Orders will still work but won\'t be queued.');
    }
};

// Try to connect but don't wait for it
connectKafka().catch(() => {
    console.log('Kafka connection failed, continuing without it...');
});

// Routes
app.get('/', (req, res) => {
    res.send('E-Cart Backend is running');
});

// Health check endpoint for Kubernetes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mock Login
app.post('/auth/login', (req, res) => {
    const { username } = req.body;
    // In a real app, verify password
    const token = 'mock-jwt-token-for-' + username;
    res.json({ token, user: { username } });
});

// Get Products (Mock)
app.get('/products', async (req, res) => {
    // In a real app, fetch from DB
    const products = [
        { id: 1, name: 'Laptop', price: 999 },
        { id: 2, name: 'Phone', price: 499 },
        { id: 3, name: 'Headphones', price: 99 }
    ];
    res.json(products);
});

// Create Order (Triggers Kafka if available)
app.post('/orders', async (req, res) => {
    const { productId, userId } = req.body;

    const order = {
        id: Math.floor(Math.random() * 1000),
        productId,
        userId,
        status: 'PENDING'
    };

    // Try to send to Kafka if connected
    if (kafkaConnected) {
        try {
            await producer.send({
                topic: 'orders',
                messages: [
                    { value: JSON.stringify(order) },
                ],
            });
            console.log('✅ Order sent to Kafka:', order);
            res.status(201).json({ message: 'Order placed successfully (queued for processing)', order });
        } catch (err) {
            console.error('⚠️  Error sending order to Kafka:', err.message);
            // Kafka failed, but order still works
            res.status(201).json({ message: 'Order placed successfully (direct processing)', order, warning: 'Event streaming unavailable' });
        }
    } else {
        // Kafka not available - still accept order
        console.log('ℹ️  Order processed without Kafka (direct mode):', order);
        res.status(201).json({ message: 'Order placed successfully', order, note: 'Event streaming unavailable' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
