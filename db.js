const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres.tguktvhzeqpsbkgqrbig',
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  database: 'postgres',
  password: 'quickpick123!@#',
  port: 5432
});

module.exports = pool;