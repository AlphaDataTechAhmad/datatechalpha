// Load environment variables with debug
require('dotenv').config({ debug: true });
const { Pool } = require('pg');
require('dotenv').config();

// Debug: Show all environment variables that start with DB_
console.log('Environment variables:');
Object.keys(process.env)
    .filter(key => key.startsWith('DB_'))
    .forEach(key => {
        console.log(`- ${key}=${key.includes('PASSWORD') ? '***' + process.env[key].slice(-3) : process.env[key]}`);
    });
console.log('');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: 'postgres', // Connect to the default 'postgres' database first
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: {
        rejectUnauthorized: false, // For testing; consider using a CA certificate in production
        sslmode: 'require'
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
    statement_timeout: 10000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
    idle_in_transaction_session_timeout: 10000
};

// Log the connection details (without full password)
console.log('Connection details:', {
    ...dbConfig,
    password: dbConfig.password ? '***' + dbConfig.password.slice(-3) : 'not set',
    passwordLength: dbConfig.password ? dbConfig.password.length : 0,
    passwordStartsWith: dbConfig.password ? dbConfig.password.substring(0, 2) + '...' : 'n/a'
});

async function testConnection() {
    const client = new Pool(dbConfig);
    try {
        console.log('🔌 Attempting to connect...');
        await client.connect();
        console.log('✅ Connected to PostgreSQL server!');
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time');
        console.log('✅ Query successful! Current server time:', result.rows[0].current_time);
        
        // List all databases
        const dbs = await client.query("SELECT datname FROM pg_database WHERE datistemplate = false AND datname != 'postgres'");
        console.log('\n📋 Available databases:');
        dbs.rows.forEach((db, index) => console.log(`${index + 1}. ${db.datname}`));
        
        return true;
        
        return true;
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify your RDS instance is running and accessible');
        console.log('2. Check if your IP is whitelisted in the RDS security group');
        console.log('3. Verify the database credentials in your .env file');
        console.log('4. Ensure the database name and username are correct');
        console.log('5. Check if the database is publicly accessible');
        return false;
    } finally {
        await client.end();
    }
}

// Run the test
testConnection().then(success => {
    if (success) {
        console.log('\n✅ Connection test completed successfully!');
    } else {
        console.log('\n❌ Connection test failed. Please check the error messages above.');
    }
});
