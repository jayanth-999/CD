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

// Connect to Kafka
const connectKafka = async () => {
    try {
        await producer.connect();
        console.log('Connected to Kafka');
    } catch (err) {
        console.error('Error connecting to Kafka', err);
    }
};
connectKafka();

// Routes
app.get('/', (req, res) => {
    res.send('E-Cart Backend is running');
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

// Create Order (Triggers Kafka)
app.post('/orders', async (req, res) => {
    const { productId, userId } = req.body;

    const order = {
        id: Math.floor(Math.random() * 1000),
        productId,
        userId,
        status: 'PENDING'
    };

    try {
        await producer.send({
            topic: 'orders',
            messages: [
                { value: JSON.stringify(order) },
            ],
        });
        console.log('Order sent to Kafka:', order);
        res.status(201).json({ message: 'Order placed successfully', order });
    } catch (err) {
        console.error('Error sending order to Kafka', err);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
