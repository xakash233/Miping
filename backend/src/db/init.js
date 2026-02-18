const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const initDb = async () => {
    try {
        // 1. Create Database if not exists
        const client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: 'postgres', // Connect to default DB
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        try {
            await client.connect();
            const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
            if (res.rowCount === 0) {
                console.log(`Database ${process.env.DB_NAME} not found. Creating...`);
                await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
                console.log('Database created.');
            } else {
                console.log(`Database ${process.env.DB_NAME} already exists.`);
            }
        } catch (err) {
            console.error('Error creating database:', err.message);
            // Fallthrough, maybe it exists or user needs to create manually
        } finally {
            await client.end();
        }

        // 2. Run Schema
        const db = require('./index'); // Now requires the pool which connects to the new DB
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema setup...');
        await db.query(schemaSql);
        console.log('Schema setup complete.');
        process.exit(0);
    } catch (err) {
        console.error('Error running schema setup:', err);
        process.exit(1);
    }
};

initDb();
