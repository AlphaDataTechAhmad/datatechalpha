# Appwrite to AWS RDS Migration

This directory contains scripts to migrate data from Appwrite to AWS RDS (PostgreSQL).

## Prerequisites

1. Node.js (v14 or later)
2. npm or yarn
3. AWS RDS PostgreSQL instance
4. Appwrite API credentials with read access

## Setup

1. Copy the example environment file and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your Appwrite and AWS RDS credentials.

2. Install dependencies:
   ```bash
   npm init -y
   npm install dotenv pg node-appwrite
   ```

## Exporting Data from Appwrite

Run the export script to download all data from Appwrite:

```bash
node export-appwrite-data.js
```

This will create an `exports` directory containing JSON files for each collection.

## Setting Up AWS RDS

1. Create a PostgreSQL database on AWS RDS if you haven't already.
2. Update the database connection details in the `.env` file.
3. The import script will create the necessary tables automatically.

## Importing Data to AWS RDS

Run the import script to load data into your RDS instance:

```bash
node import-to-rds.js
```

## Customizing the Migration

1. **Data Model**: Update the `CREATE_TABLES_SQL` in `import-to-rds.js` to match your database schema.
2. **Data Mapping**: Modify the import logic in the `importCollection` function to map Appwrite documents to your database tables.
3. **Collections**: Add or remove collections in the `COLLECTIONS` object in both scripts as needed.

## Important Notes

- The scripts include basic error handling but should be tested in a non-production environment first.
- For large datasets, consider running the import in batches to avoid timeouts.
- Make sure to back up your database before running the import.
- The import script uses transactions to ensure data consistency.

## Troubleshooting

- **Connection Issues**: Verify your AWS RDS security group allows connections from your IP.
- **Permission Errors**: Ensure your database user has the necessary permissions.
- **Data Mismatches**: Check the console output for any import errors and verify your data mapping.

## Next Steps

After migration:
1. Verify the data in your RDS instance.
2. Update your application to use the new database connection.
3. Consider setting up monitoring for your RDS instance.
