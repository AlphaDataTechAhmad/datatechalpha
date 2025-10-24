require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000, // 10 seconds timeout
    idleTimeoutMillis: 20000, // 20 seconds idle timeout
    max: 10, // max number of clients in the pool
};

// Test database connection
async function testConnection() {
    const testClient = new Pool(dbConfig);
    try {
        console.log('Testing database connection...');
        await testClient.connect();
        const res = await testClient.query('SELECT NOW()');
        console.log('✅ Database connection successful! Server time:', res.rows[0].now);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Verify your RDS instance is running');
        console.log('2. Check if your IP is whitelisted in the RDS security group');
        console.log('3. Verify the database credentials in .env file');
        console.log('4. Ensure the database name and username are correct');
        console.log('5. Check if the database is publicly accessible');
        return false;
    } finally {
        await testClient.end();
    }
}

const pool = new Pool(dbConfig);
const EXPORT_DIR = path.join(__dirname, 'exports');

// Table creation SQL
const CREATE_TABLES_SQL = `
    -- Create your tables here based on your data model
    -- This is a simplified example - adjust according to your actual schema
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        appwrite_id TEXT UNIQUE,
        email TEXT,
        name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        appwrite_id TEXT UNIQUE,
        title TEXT,
        description TEXT,
        created_at TIMESTAMP
    );

    -- Add more tables as needed for your data model
`;

async function createTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(CREATE_TABLES_SQL);
        await client.query('COMMIT');
        console.log('✅ Database tables created successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating tables:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function importCollection(collectionName) {
    const filePath = path.join(EXPORT_DIR, `${collectionName}.json`);
    
    try {
        const data = await fs.readFile(filePath, 'utf8');
        const documents = JSON.parse(data);
        
        if (documents.length === 0) {
            console.log(`No documents to import for ${collectionName}`);
            return 0;
        }

        const client = await pool.connect();
        let importedCount = 0;

        try {
            await client.query('BEGIN');
            
            for (const doc of documents) {
                // Example for users collection - adjust based on your data model
                if (collectionName === 'USER_PROFILES') {
                    await client.query(
                        `INSERT INTO users (appwrite_id, email, name, created_at)
                         VALUES ($1, $2, $3, $4)
                         ON CONFLICT (appwrite_id) DO NOTHING`,
                        [doc.$id, doc.email, doc.name, new Date(doc.$createdAt)]
                    );
                }
                // Add more collection handlers as needed
                
                importedCount++;
                if (importedCount % 100 === 0) {
                    console.log(`Imported ${importedCount} ${collectionName} records...`);
                }
            }
            
            await client.query('COMMIT');
            console.log(`✅ Successfully imported ${importedCount} ${collectionName} records`);
            return importedCount;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Error importing ${collectionName}:`, error);
            return 0;
        } finally {
            client.release();
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log(`No export file found for ${collectionName}, skipping...`);
            return 0;
        }
        console.error(`Error reading export file for ${collectionName}:`, error);
        return 0;
    }
}

async function runImport() {
    try {
        console.log('Starting data import to AWS RDS...');
        
        // Test database connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            console.error('❌ Cannot proceed with import. Please fix the database connection issues first.');
            process.exit(1);
        }
        
        // Create database tables
        await createTables();
        
        // Import each collection
        const collections = [
            'USER_PROFILES',
            'COURSES',
            'LECTURES',
            'ENROLLMENTS',
            'TESTS',
            'TEST_RESULTS',
            'QUESTIONS',
            'QUESTION_BANKS',
            'EXAM_ATTEMPTS',
            'INTERNSHIPS',
            'INTERNSHIP_APPLICATIONS',
            'STUDENT_DATA',
            'SCHOLARSHIP_APPLICATIONS'
        ];
        
        let totalImported = 0;
        for (const collection of collections) {
            const count = await importCollection(collection);
            totalImported += count;
        }
        
        console.log(`\n✅ Import completed! Total records imported: ${totalImported}`);
    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runImport();
