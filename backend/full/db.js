import knex from 'knex';
import knexfile from './knexfile.js';

const environment = process.env.NODE_ENV || 'development';
const config = knexfile[environment];

const db = knex(config);

// Connection health check function
export const checkConnection = async () => {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Connection pool monitoring
export const getPoolStatus = () => {
  if (environment === 'production') {
    return {
      used: db.client.pool.numUsed(),
      free: db.client.pool.numFree(),
      pending: db.client.pool.numPendingCreates()
    };
  }
  return { used: 0, free: 0, pending: 0 };
};

// Graceful shutdown handler
export const closeConnection = async () => {
  try {
    await db.destroy();
    console.log('Database connection pool closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

export default db;
