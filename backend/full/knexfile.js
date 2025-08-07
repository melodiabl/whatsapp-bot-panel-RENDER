import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  development: {
    client: 'sqlite3',
    connection: {
      filename: join(__dirname, 'storage', 'database.sqlite')
    },
    migrations: {
      directory: join(__dirname, 'migrations'),
      loadExtensions: ['.js', '.cjs']
    },
    useNullAsDefault: true,
    pool: {
      min: 1,
      max: 5,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: join(__dirname, 'migrations'),
      loadExtensions: ['.js', '.cjs']
    },
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    pool: {
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
    }
  }
};
