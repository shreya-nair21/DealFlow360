/**
 * DealFlow360 - Database Connectivity & Store Layer
 * Connects to PostgreSQL via pg Pool, with fallback store if PostgreSQL DB service is unavailable.
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/dealflow360';

export const pool = new Pool({
  connectionString,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

let isPostgresAvailable = false;

// Test DB Connection at Startup
pool.connect()
  .then(client => {
    console.log('✅ Successfully connected to PostgreSQL Database.');
    isPostgresAvailable = true;
    client.release();
  })
  .catch(err => {
    console.warn('ℹ️ PostgreSQL connection not established. Operating in High-Performance Local Store mode.');
    isPostgresAvailable = false;
  });

export function isPgConnected() {
  return isPostgresAvailable;
}
