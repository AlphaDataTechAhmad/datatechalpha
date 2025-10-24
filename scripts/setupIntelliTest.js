/**
 * IntelliTest Full Database Setup for Appwrite
 * Compatible with Appwrite v1.8.0+
 * Author: Sparsh Chaudhary
 */

const { Client, Databases, ID, Query } = require("node-appwrite");
require("dotenv").config();

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const databaseId = '68cb297b003c9c7471fc';

// Helper sleep
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

// ---------------- Helper Functions ----------------

async function createCollectionWithRetry(name, permissions = []) {
  try {
    const collections = await databases.listCollections(databaseId, [
      Query.equal("name", name),
    ]);
    if (collections.collections.length > 0) {
      console.log(`ℹ️ Collection ${name} already exists.`);
      return collections.collections[0].$id;
    }
    const collection = await databases.createCollection(
      databaseId,
      ID.unique(),
      name,
      permissions
    );
    console.log(`✅ Created collection: ${name}`);
    return collection.$id;
  } catch (err) {
    console.error(`❌ Error creating collection ${name}:`, err.message);
    throw err;
  }
}

async function attributeExists(collectionId, key) {
  const collection = await databases.getCollection(databaseId, collectionId);
  return collection.attributes.some((a) => a.key === key);
}

async function createAttribute(collectionId, type, key, required = true) {
  if (await attributeExists(collectionId, key)) {
    console.log(`   ℹ️ Attribute ${key} exists, skipping...`);
    return;
  }

  try {
    switch (type) {
      case "string":
        await databases.createStringAttribute(databaseId, collectionId, key, 255, required);
        break;
      case "email":
        await databases.createEmailAttribute(databaseId, collectionId, key, required);
        break;
      case "integer":
        await databases.createIntegerAttribute(databaseId, collectionId, key, required);
        break;
      case "float":
        await databases.createFloatAttribute(databaseId, collectionId, key, required);
        break;
      case "boolean":
        await databases.createBooleanAttribute(databaseId, collectionId, key, required);
        break;
      case "datetime":
        await databases.createDatetimeAttribute(databaseId, collectionId, key, required);
        break;
      case "enum":
        await databases.createEnumAttribute(databaseId, collectionId, key, ["draft"], required);
        break;
      default:
        await databases.createStringAttribute(databaseId, collectionId, key, 255, required);
    }
    console.log(`   ✅ Added ${type} attribute: ${key}`);
  } catch (err) {
    if (err.code === 409) console.log(`   ⚠️ ${key} already exists`);
    else console.error(`   ❌ Error creating ${key}:`, err.message);
  }
}

async function createIndex(collectionId, key, attributes, type = "key") {
  try {
    await databases.createIndex(databaseId, collectionId, key, attributes, type);
    console.log(`   ✅ Created index ${key}`);
  } catch (err) {
    if (err.code === 409)
      console.log(`   ℹ️ Index ${key} already exists, skipping...`);
    else console.error(`   ❌ Index error ${key}:`, err.message);
  }
}

// ---------------- Collection Definitions ----------------

const collections = [
  // 1️⃣ USERS
  {
    name: "users",
    attrs: [
      ["string", "name"],
      ["email", "email"],
      ["string", "password"],
      ["enum", "role"],
      ["string", "avatar"],
      ["datetime", "createdAt"],
      ["datetime", "lastLogin"],
      ["enum", "status"],
      ["string", "institution"],
      ["string", "department"],
      ["string", "phone"],
    ],
    indexes: [["email_idx", ["email"], "unique"]],
  },

  // 2️⃣ EXAMS
  {
    name: "exams",
    attrs: [
      ["string", "title"],
      ["string", "description"],
      ["integer", "duration"],
      ["integer", "totalMarks"],
      ["integer", "passingMarks"],
      ["string", "instructions"],
      ["datetime", "startTime"],
      ["datetime", "endTime"],
      ["string", "createdBy"],
      ["datetime", "createdAt"],
      ["datetime", "updatedAt"],
      ["enum", "status"],
      ["boolean", "shuffleQuestions"],
      ["boolean", "shuffleOptions"],
      ["boolean", "showResults"],
      ["boolean", "allowReview"],
      ["boolean", "webcamRequired"],
      ["boolean", "fullScreenRequired"],
      ["integer", "maxAttempts"],
      ["integer", "timeLimitPerQuestion"],
    ],
    indexes: [["status_idx", ["status"], "key"]],
  },

  // 3️⃣ QUESTIONS
  {
    name: "questions",
    attrs: [
      ["string", "examId"],
      ["string", "sectionId"],
      ["enum", "type"],
      ["string", "question"],
      ["string", "description"],
      ["integer", "marks"],
      ["enum", "difficulty"],
      ["string", "category"],
      ["string", "createdBy"],
      ["datetime", "createdAt"],
      ["datetime", "updatedAt"],
      ["enum", "status"],
    ],
  },

  // 4️⃣ EXAM ATTEMPTS
  {
    name: "exam_attempts",
    attrs: [
      ["string", "examId"],
      ["string", "userId"],
      ["datetime", "startedAt"],
      ["datetime", "submittedAt"],
      ["integer", "timeSpent"],
      ["enum", "status"],
      ["float", "score"],
      ["float", "percentage"],
      ["boolean", "passed"],
      ["string", "ipAddress"],
      ["string", "userAgent"],
    ],
  },

  // 5️⃣ ANSWERS
  {
    name: "answers",
    attrs: [
      ["string", "attemptId"],
      ["string", "questionId"],
      ["string", "userId"],
      ["string", "answer"],
      ["boolean", "isCorrect"],
      ["float", "marksAwarded"],
      ["string", "feedback"],
      ["string", "gradedBy"],
      ["datetime", "gradedAt"],
      ["integer", "timeSpent"],
      ["string", "code"],
    ],
  },

  // 6️⃣ RESULTS
  {
    name: "results",
    attrs: [
      ["string", "attemptId"],
      ["string", "examId"],
      ["string", "userId"],
      ["float", "score"],
      ["float", "percentage"],
      ["boolean", "passed"],
      ["integer", "rank"],
      ["float", "percentile"],
      ["string", "feedback"],
      ["datetime", "generatedAt"],
    ],
  },

  // 7️⃣ QUESTION BANKS
  {
    name: "question_banks",
    attrs: [
      ["string", "name"],
      ["string", "description"],
      ["string", "createdBy"],
      ["boolean", "isPublic"],
      ["integer", "questionCount"],
      ["datetime", "createdAt"],
      ["datetime", "updatedAt"],
    ],
  },

  // 8️⃣ NOTIFICATIONS
  {
    name: "notifications",
    attrs: [
      ["string", "userId"],
      ["enum", "type"],
      ["string", "title"],
      ["string", "message"],
      ["string", "relatedId"],
      ["boolean", "isRead"],
      ["datetime", "createdAt"],
      ["datetime", "readAt"],
    ],
  },

  // 9️⃣ CERTIFICATES
  {
    name: "certificates",
    attrs: [
      ["string", "userId"],
      ["string", "examId"],
      ["string", "attemptId"],
      ["string", "certificateNumber"],
      ["datetime", "issueDate"],
      ["datetime", "expiryDate"],
      ["string", "downloadUrl"],
      ["string", "verificationCode"],
      ["float", "score"],
      ["float", "percentage"],
      ["string", "grade"],
    ],
  },

  // 🔟 SYSTEM SETTINGS
  {
    name: "system_settings",
    attrs: [
      ["string", "key"],
      ["string", "value"],
      ["enum", "dataType"],
      ["enum", "category"],
      ["string", "description"],
      ["boolean", "isPublic"],
      ["string", "updatedBy"],
      ["datetime", "updatedAt"],
    ],
  },
];

// ---------------- Main Function ----------------

async function setupCollections() {
  console.log("🚀 Setting up IntelliTest full schema...");

  for (const col of collections) {
    console.log(`\n🔨 Setting up: ${col.name}`);
    const collectionId = await createCollectionWithRetry(col.name, [
      'read("any")',
      'create("users")',
      'update("users")',
      'delete("users")',
    ]);

    for (const [type, key, req] of col.attrs) {
      await createAttribute(collectionId, type, key, req ?? true);
      await sleep(100);
    }

    for (const [key, attrs, type] of col.indexes || []) {
      await createIndex(collectionId, key, attrs, type);
    }

    console.log(`✅ Finished ${col.name}`);
  }

  console.log("\n🎉 All collections created successfully!");
}

// ---------------- Run ----------------

setupCollections().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});
