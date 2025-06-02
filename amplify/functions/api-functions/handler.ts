import type { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';

// PostgreSQL client for direct database connection
let pgClient: Client | null = null;

interface FoodItem {
  id: number;
  name: string;
  calories: number;
}

interface DBRow {
  id: string | number;
  name: string;
  calories: string | number;
}

// Initialize PostgreSQL client using the connection string
const initializePostgreSQLClient = async (): Promise<Client | null> => {
  if (!pgClient) {
    try {
      const connectionString = process.env.SQL_CONNECTION_STRING;
      
      if (!connectionString) {
        console.error('❌ SQL_CONNECTION_STRING environment variable not found');
        return null;
      }
      
      console.log('🔗 Connecting to PostgreSQL database...');
      pgClient = new Client({
        connectionString: connectionString,
        ssl: {
          rejectUnauthorized: false // Required for AWS RDS
        }
      });
      
      await pgClient.connect();
      console.log('✅ Successfully connected to PostgreSQL database');
      
      return pgClient;
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      pgClient = null;
      return null;
    }
  }
  return pgClient;
};

// Fetch food items directly from PostgreSQL
const fetchFoodItemsFromDB = async (): Promise<FoodItem[] | null> => {
  const client = await initializePostgreSQLClient();
  if (!client) return null;
  
  try {
    const result = await client.query('SELECT id, name, calories FROM food_items ORDER BY id ASC');
    console.log(`✅ Fetched ${result.rows.length} food items from PostgreSQL`);
    return result.rows.map((row: DBRow): FoodItem => ({
      id: parseInt(String(row.id)),
      name: String(row.name),
      calories: parseInt(String(row.calories))
    }));
  } catch (error) {
    console.error('❌ Error querying PostgreSQL:', error);
    return null;
  }
};

// Create food item directly in PostgreSQL
const createFoodItemInDB = async (name: string, calories: number): Promise<FoodItem | null> => {
  const client = await initializePostgreSQLClient();
  if (!client) return null;
  
  try {
    // Generate a unique ID
    const idResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM food_items');
    const nextId = idResult.rows[0].next_id;
    
    const result = await client.query(
      'INSERT INTO food_items (id, name, calories) VALUES ($1, $2, $3) RETURNING id, name, calories',
      [nextId, name, calories]
    );
    
    console.log(`✅ Created food item in PostgreSQL: ${name}`);
    return {
      id: parseInt(result.rows[0].id),
      name: String(result.rows[0].name),
      calories: parseInt(result.rows[0].calories)
    };
  } catch (error) {
    console.error('❌ Error creating food item in PostgreSQL:', error);
    return null;
  }
};

// Search food items directly in PostgreSQL
const searchFoodItemsInDB = async (searchTerm: string): Promise<FoodItem[] | null> => {
  const client = await initializePostgreSQLClient();
  if (!client) return null;
  
  try {
    const result = await client.query(
      'SELECT id, name, calories FROM food_items WHERE LOWER(name) LIKE LOWER($1) ORDER BY id ASC',
      [`%${searchTerm}%`]
    );
    
    console.log(`✅ Found ${result.rows.length} matching food items in PostgreSQL`);
    return result.rows.map((row: DBRow): FoodItem => ({
      id: parseInt(String(row.id)),
      name: String(row.name),
      calories: parseInt(String(row.calories))
    }));
  } catch (error) {
    console.error('❌ Error searching food items in PostgreSQL:', error);
    return null;
  }
};

// Mock food database - Fallback data
const foodDatabase = [
  { id: 1, name: 'Apple', calories: 95 },
  { id: 2, name: 'Banana', calories: 105 },
  { id: 3, name: 'Chicken Breast (100g)', calories: 165 },
  { id: 4, name: 'Rice (1 cup cooked)', calories: 205 },
  { id: 5, name: 'Broccoli (100g)', calories: 34 },
  { id: 6, name: 'Salmon (100g)', calories: 208 },
  { id: 7, name: 'Greek Yogurt (1 cup)', calories: 130 },
  { id: 8, name: 'Almonds (28g)', calories: 164 },
  { id: 9, name: 'Avocado (1 medium)', calories: 234 },
  { id: 10, name: 'Oatmeal (1 cup cooked)', calories: 154 }
];

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  
  console.log('🚀 Lambda function started');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // CORS headers for API Gateway
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Requested-With',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  try {
    const path = event.path || '/';
    const method = event.httpMethod;

    console.log(`Processing ${method} ${path}`);

    // GET /foods - Get all food items from PostgreSQL database
    if (method === 'GET' && (path === '/foods' || path.endsWith('/foods'))) {
      console.log('📋 Fetching all food items from database');
      
      const foodItems = await fetchFoodItemsFromDB();
      
      if (foodItems) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: foodItems,
            message: 'Food items retrieved from PostgreSQL database',
            source: 'database',
            count: foodItems.length,
            debug: 'Successfully fetched from database'
          })
        };
      }
      
      // Fallback to mock data
      console.log('📦 Using fallback data - no database client available');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: foodDatabase,
          message: 'Food items retrieved from fallback data (database not available)',
          source: 'fallback',
          debug: 'No database client initialized'
        })
      };
    }

    // GET /foods/{id} - Get specific food item
    if (method === 'GET' && path.includes('/foods/') && !path.includes('/search')) {
      const pathParts = path.split('/');
      const id = pathParts[pathParts.length - 1];
      console.log(`🔍 Looking for food item with id: ${id}`);
      
      const foodItems = await fetchFoodItemsFromDB();
      
      if (foodItems) {
        const foodItem = foodItems.find(item => item.id === parseInt(id));
        
        if (foodItem) {
          console.log(`✅ Found food item in database: ${foodItem.name}`);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              data: foodItem,
              source: 'database'
            })
          };
        }
      }
      
      // Fallback to mock data
      const food = foodDatabase.find(f => f.id === parseInt(id));
      
      if (!food) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Food item not found'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: food,
          source: 'fallback'
        })
      };
    }

    // GET /foods/search?name={foodName} - Search for food by name
    if (method === 'GET' && path.includes('/search')) {
      const searchName = event.queryStringParameters?.name?.toLowerCase();
      console.log(`🔍 Searching for: ${searchName}`);
      
      if (!searchName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Name parameter is required'
          })
        };
      }

      const foodItems = await searchFoodItemsInDB(searchName);
      
      if (foodItems) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: foodItems,
            query: searchName,
            message: `Found ${foodItems.length} matching items in database`,
            source: 'database'
          })
        };
      }

      // Fallback to mock data search
      const matchingFoods = foodDatabase.filter(food => 
        food.name.toLowerCase().includes(searchName)
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: matchingFoods,
          query: searchName,
          message: `Found ${matchingFoods.length} matching items in fallback data`,
          source: 'fallback'
        })
      };
    }

    // POST /foods - Add new food item
    if (method === 'POST' && (path === '/foods' || path.endsWith('/foods'))) {
      const body = JSON.parse(event.body || '{}');
      const { name, calories } = body;

      console.log(`➕ Creating new food item: ${name} (${calories} calories)`);

      if (!name || !calories) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Name and calories are required'
          })
        };
      }

      const foodItem = await createFoodItemInDB(name, calories);
      
      if (foodItem) {
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            data: foodItem,
            message: 'Food item created in PostgreSQL database',
            source: 'database'
          })
        };
      }

      // Fallback: simulate creation with mock data
      const newFood = {
        id: Math.max(...foodDatabase.map(f => f.id)) + 1,
        name: String(name),
        calories: Number(calories)
      };

      console.log(`📦 Using fallback storage (not persistent)`);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: newFood,
          message: 'Food item created in fallback storage (not persistent)',
          source: 'fallback'
        })
      };
    }

    // Route not found
    console.log(`❌ Route not found: ${method} ${path}`);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Route not found: ${method} ${path}`,
        availableRoutes: [
          'GET /foods - Get all food items',
          'GET /foods/{id} - Get specific food item',
          'GET /foods/search?name={name} - Search food items',
          'POST /foods - Create new food item'
        ]
      })
    };

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};