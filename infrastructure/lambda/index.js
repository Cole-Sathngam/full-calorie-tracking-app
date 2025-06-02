/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { Client } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

let dbClient = null;
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION });

async function getDbCredentials() {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN
    });
    const secret = await secretsClient.send(command);
    return JSON.parse(secret.SecretString);
  } catch (error) {
    console.error('Error getting DB credentials:', error);
    throw error;
  }
}

async function connectToDb() {
  if (dbClient && !dbClient.ended) {
    return dbClient;
  }
  
  try {
    const credentials = await getDbCredentials();
    
    dbClient = new Client({
      host: process.env.DB_ENDPOINT,
      port: parseInt(process.env.DB_PORT),
      database: process.env.DB_NAME,
      user: credentials.username,
      password: credentials.password,
      ssl: {
        rejectUnauthorized: false
      },
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });
    
    await dbClient.connect();
    console.log('Connected to PostgreSQL database');
    
    // Create food_items table if it doesn't exist
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS food_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        calories INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('food_items table ready');
    
    return dbClient;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json'
  };

  try {
    // Handle OPTIONS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight successful' })
      };
    }

    // Only handle search endpoint
    if (event.httpMethod === 'GET' && event.path.includes('/foods/search')) {
      const db = await connectToDb();
      const queryParams = event.queryStringParameters || {};
      const searchTerm = queryParams.name || '';
      
      const result = await db.query(
        'SELECT * FROM food_items WHERE name ILIKE $1 ORDER BY name',
        [`%${searchTerm}%`]
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: result.rows,
          message: `Search results for "${searchTerm}"`,
          source: 'postgresql',
          count: result.rows.length
        })
      };
    }
    
    // Default response for unsupported routes
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Only search endpoint is supported',
        path: event.path,
        method: event.httpMethod
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        source: 'postgresql'
      })
    };
  }
}; 