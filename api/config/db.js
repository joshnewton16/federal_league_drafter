// api/config/db.js
const { Pool } = require('pg');

// Configure PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://federal_league_admin:jLriXmc4MNd8@ep-flat-paper-a5bp6umk.us-east-2.aws.neon.tech/federal_league?sslmode=require',
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
});

// Setup schema prefix
const schemaPrefix = process.env.DB_SCHEMA || 'federal_league';

// Test database connection (this will run when the module is loaded)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully:', res?.rows?.[0]?.now);
  }
});

module.exports = { pool, schemaPrefix };