const pool = require('./db');

(async () => {
  try {
    const res = await pool.query('SELECT * FROM users');
    console.log('🧑‍💻 users:', res.rows);
  } catch (err) {
    console.error('❌ 오류:', err);
  }
})();
