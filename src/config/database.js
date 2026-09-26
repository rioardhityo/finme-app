const mongoose = require('mongoose');

let connectionPromise;

async function connectDatabase() {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
        throw new Error('MONGO_URI is not configured');
    }

    if (mongoose.connection.readyState === 1) return;

    if (!connectionPromise || mongoose.connection.readyState === 0) {
        connectionPromise = mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000
        }).then(() => {
            console.log('Connected to MongoDB');
        }).catch((error) => {
            connectionPromise = undefined;
            throw error;
        });
    }

    await connectionPromise;
}

module.exports = connectDatabase;
