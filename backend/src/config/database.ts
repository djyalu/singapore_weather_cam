import knex from 'knex';
import { config } from './environment';

export const db = knex({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: {
    min: 2,
    max: 10,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  },
  migrations: {
    directory: '../../database/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../../database/seeds',
    extension: 'ts',
  },
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}