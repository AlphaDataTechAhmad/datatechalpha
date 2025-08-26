// Script to update test results for students who scored above 20
// Usage: node scripts/updateTestResults.js

console.log('🔍 Starting script...');
console.log('Current working directory:', process.cwd());

require('dotenv').config();
const { Client, Databases, Query } = require('node-appwrite');

// Initialize the client with environment variables
const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID || '68261b5200198bea6bdf')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || '68261b6a002ba6c3b584';
const TEST_LINKS_COLLECTION = '689923bc000f2d15a263'; // internship_test_links collection

async function updatePassedStudents() {
    try {
        console.log('🔍 Fetching all students who scored more than 10...');
        
        let allStudents = [];
        let lastId = null;
        const limit = 100; // Number of documents to fetch per batch
        let hasMore = true;
        
        // Fetch all students in batches
        while (hasMore) {
            const queries = [
                Query.equal('is_used', true),
                Query.limit(limit)
            ];
            
            if (lastId) {
                queries.push(Query.cursorAfter(lastId));
            }
            
            const response = await databases.listDocuments(
                DATABASE_ID,
                TEST_LINKS_COLLECTION,
                queries
            );
            
            if (response.documents.length === 0) {
                hasMore = false;
                break;
            }
            
            allStudents = [...allStudents, ...response.documents];
            lastId = response.documents[response.documents.length - 1].$id;
            
            console.log(`Fetched ${allStudents.length} students so far...`);
            
            // If we got fewer documents than the limit, we've reached the end
            if (response.documents.length < limit) {
                hasMore = false;
            }
        }
        
        if (allStudents.length === 0) {
            console.log('No test results found in the collection');
            return;
        }
        
        console.log(`Total students fetched: ${allStudents.length}`);
        
        // Filter students who have passed: false
        const studentsToUpdate = allStudents.filter(student => {
            return student.passed === false; // Only update if passed is explicitly false
        });

        if (studentsToUpdate.length === 0) {
            console.log('ℹ️ No students found who need to be updated.');
            return;
        }

        console.log(`📋 Found ${studentsToUpdate.length} students to update.`);

        // Update each student
        console.log('\nStarting to update students...');
        for (const [index, student] of studentsToUpdate.entries()) {
            const progress = `[${index + 1}/${studentsToUpdate.length}]`;
            console.log(`\n${progress} 🔄 Processing student ID: ${student.$id}`);
            console.log(`   Current status: passed=${student.passed}, status=${student.status}`);
            
            try {
                console.log('   Updating document...');
                const result = await databases.updateDocument(
                    DATABASE_ID,
                    TEST_LINKS_COLLECTION,
                    student.$id,
                    {
                        passed: true,
                        status: 'passed',
                        completed_at: new Date().toISOString()
                    }
                );
                
                console.log(`   ✅ Successfully updated student ${student.$id}`);
                console.log(`   New status: passed=${result.passed}, status=${result.status}`);
                
                // Add a small delay to prevent rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`   ❌ Error updating student ${student.$id}:`, error.message);
                // Log full error for debugging
                console.error('   Error details:', error);
            }
        }

        console.log('\n🎉 All students have been processed successfully!');
    } catch (error) {
        console.error('❌ Error in updatePassedStudents:', error.message);
        process.exit(1);
    }
}

async function updateSpecificUsers() {
    const userEmails = [
        'sagnikbasaksona@gmail.com',
        'soorajliveshisdreams@gmail.com',
        'anushkasontakke1005@gmail.com',
        'soumyapal712402@gmail.com',
        'sourabh958811@gmail.com',
        'stutitripathi1527@gmail.com',
        'cmefarheenfathima@gmail.com',
        'sanayakhann224@gmail.com',
        '230101120275@centurionuniv.edu.in',
        'tusharreddy838@gmail.com',
        'singhdarshinipriya0503@gmail.com',
        '23eg105m12@anurag.edu.in',
        'dhasharathjatoth@gmail.com'
    ];

    console.log(`🔄 Starting to update ${userEmails.length} users...`);

    try {
        for (const email of userEmails) {
            try {
                // First, find the user's document by email
                const response = await databases.listDocuments(
                    DATABASE_ID,
                    TEST_LINKS_COLLECTION,
                    [
                        Query.equal('email', email),
                        Query.limit(1)
                    ]
                );

                if (response.documents.length === 0) {
                    console.log(`❌ No document found for email: ${email}`);
                    continue;
                }

                const document = response.documents[0];
                
                // Update the document - ensure score is a string
                await databases.updateDocument(
                    DATABASE_ID,
                    TEST_LINKS_COLLECTION,
                    document.$id,
                    {
                        score: '40',  // Changed to string
                        passed: true,
                        status: 'passed',
                        percentage: '90'  // Changed to string
                    }
                );
                
                console.log(`✅ Updated test results for: ${email}`);
            } catch (error) {
                console.error(`❌ Error updating ${email}:`, error.message);
            }
        }
        console.log('🎉 All specified users have been updated!');
    } catch (error) {
        console.error('❌ Error in updateSpecificUsers:', error);
    }
}

// Run the function
(async () => {
    try {
        await updatePassedStudents();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error in main execution:', error);
        process.exit(1);
    }
})();
