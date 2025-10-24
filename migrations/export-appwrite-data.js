require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');
const fs = require('fs').promises;
const path = require('path');

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

// Collection IDs from your config
const COLLECTIONS = {
    LECTURES: '684bc356000b2a6e138f',
    ENROLLMENTS: '684dc01f003312e04f0c',
    TESTS: '686520c7001bd5bb53b3',
    TEST_RESULTS: '684da84500159ddfea6f',
    QUESTIONS: '686520c7001bd5bb53b4',
    QUESTION_BANKS: '686520c7001bd5bb53b5',
    EXAM_ATTEMPTS: '686520c7001bd5bb53b6',
    COURSES: '682644ed002b437582d3',
    INTERNSHIPS: '6884925d00189c3d5816',
    INTERNSHIP_APPLICATIONS: '6884a2ca0003ae2e2fba',
    USER_PROFILES: '68261bb5000a54d8652b',
    STUDENT_DATA: '6893094c00238ff6f729',
    SCHOLARSHIP_APPLICATIONS: process.env.SCHOLARSHIP_APPLICATIONS_COLLECTION_ID || '68986fdc003214947765'
};

const DATABASE_ID = '68261b6a002ba6c3b584';
const EXPORT_DIR = path.join(__dirname, 'exports');

async function ensureExportDir() {
    try {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

async function exportCollection(collectionName, collectionId) {
    console.log(`Exporting ${collectionName}...`);
    let allDocuments = [];
    let offset = 0;
    const limit = 100; // Appwrite's max limit per page

    try {
        while (true) {
            const response = await databases.listDocuments(
                DATABASE_ID,
                collectionId,
                [
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );

            const { documents, total } = response;
            allDocuments = [...allDocuments, ...documents];
            
            if (allDocuments.length >= total || documents.length < limit) {
                break;
            }
            
            offset += limit;
        }

        const exportPath = path.join(EXPORT_DIR, `${collectionName}.json`);
        await fs.writeFile(exportPath, JSON.stringify(allDocuments, null, 2));
        console.log(`✅ Exported ${allDocuments.length} ${collectionName} to ${exportPath}`);
        
        return allDocuments.length;
    } catch (error) {
        console.error(`❌ Error exporting ${collectionName}:`, error.message);
        return 0;
    }
}

async function runExport() {
    try {
        await ensureExportDir();
        console.log('Starting Appwrite data export...');
        
        let totalExported = 0;
        
        for (const [name, id] of Object.entries(COLLECTIONS)) {
            const count = await exportCollection(name, id);
            totalExported += count;
        }
        
        console.log(`\n✅ Export completed! Total documents exported: ${totalExported}`);
        console.log(`Exported files are saved in: ${EXPORT_DIR}`);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
}

runExport();
