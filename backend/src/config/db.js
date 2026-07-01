import pg from 'pg';

const { Pool } = pg;


export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

export async function query(text, params) {
  const result = await pool.query(text, params);
  return result;
}


export async function connectWithRetry(maxAttempts = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connection established.');
      return;
    } catch (err) {
      console.warn(`DB connection attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt === maxAttempts) throw new Error('Could not connect to database after maximum retries.');
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
