require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const licenseRoutes = require('./routes/licenses');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/licenses', licenseRoutes);

app.use((error, req, res, next) => {
    if (error.code === 11000) {
        return res.status(409).json({ message: 'A license with this code already exists' });
    }
    if (error.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid license id' });
    }
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
