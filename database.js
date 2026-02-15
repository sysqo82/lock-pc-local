const { Pool } = require('pg');

let pool;

async function initDb() {
    try {
        // Simple PostgreSQL connection for Docker environment
        pool = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            user: process.env.DB_USER || 'lockpc_user',
            password: process.env.DB_PASSWORD || 'lockpc_password',
            database: process.env.DB_DATABASE || 'lockpc_db',
            max: parseInt(process.env.DB_POOL_MAX || '10', 10),
            idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
            connectionTimeoutMillis: parseInt(process.env.DB_CONN_TIMEOUT_MS || '10000', 10),
        });

        // Test the connection
        const client = await pool.connect();
        console.log('Successfully connected to PostgreSQL database!');
        client.release();

        // The schema is created by init-db.sql, but we can add any runtime migrations here
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing database:', err);
        throw err;
    }
}

function getPool() {
    if (!pool) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return pool;
}

function query(text, params) {
    if (!pool) {
        throw new Error('Database not initialized. Call initDb() first.');
    }
    return pool.query(text, params);
}

module.exports = { initDb, getPool, query };
