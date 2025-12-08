const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',               // 설치할 때 설정한 PostgreSQL 사용자
  host: 'localhost',              // 내 컴퓨터니까 localhost
  database: 'postgres',           // pgAdmin에서 복원한 데이터베이스 이름
  password: '2101',  // 이거 까먹으면 안됨
  port: 5433                      // 설치할 때 설정한 포트 (기본값이 5432인데 넌 5433일 수도 있어)
});

module.exports = pool;
