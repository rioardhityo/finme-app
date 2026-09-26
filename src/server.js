const app = require('./app');
const connectDatabase = require('./config/database');

const port = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();
    app.listen(port, () => {
        console.log(`License API listening on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
});
