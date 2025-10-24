const { Client } = require('pg');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const dbName = process.env.DB_NAME;

async function createDatabase() {
    // First connect to the default 'postgres' database
    const client = new Client({ ...config, database: 'postgres' });
    
    try {
        console.log('🔌 Connecting to PostgreSQL server...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL server');
        
        // Check if database already exists
        console.log(`🔍 Checking if database '${dbName}' exists...`);
        const dbCheck = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1', 
            [dbName]
        );
        
        if (dbCheck.rows.length === 0) {
            console.log(`🛠️  Creating database: ${dbName}`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database '${dbName}' created successfully!`);
            
            // Now connect to the new database to set up permissions
            await client.end();
            const newDbClient = new Client({ ...config, database: dbName });
            
            try {
                await newDbClient.connect();
                console.log(`\n🔑 Setting up permissions for '${process.env.DB_USER}'...`);
                await newDbClient.query(`
                    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${process.env.DB_USER}";
                    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${process.env.DB_USER}";
                    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO "${process.env.DB_USER}";
                `);
                console.log('✅ Permissions granted successfully!');
            } catch (error) {
                console.error('Error setting up permissions:', error.message);
            } finally {
                await newDbClient.end();
            }
        } else {
            console.log(`ℹ️  Database '${dbName}' already exists`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify your RDS instance is running and accessible');
        console.log('2. Check if your IP is whitelisted in the RDS security group');
        console.log('3. Verify the database credentials in your .env file');
        console.log('4. Ensure the user has sufficient permissions to create databases');
    } finally {
        if (client) {
            await client.end();
            console.log('\n🔌 Disconnected from PostgreSQL server');
        }
    }
}

createDatabase();
