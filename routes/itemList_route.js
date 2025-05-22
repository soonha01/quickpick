const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// 경매 리스트 페이지
router.get('/itemList', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemList.html'));
});

// 경매 글쓰기 페이지
router.get('/itemWrite', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemWrite.html'));
});

// 경매 글 등록 처리
router.post('/itemWrite', async (req, res) => {
  console.log('📦 세션 정보:', req.session.user);
  const user = req.session.user; // ✅ 이 줄 꼭 필요함!
  
  if (!user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  const { title, description, duration, minPrice, bidStep } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO auction (
        user_key, title, content, end_time,
        start_price, current_price, bid_unit,
        status, created_at, image_url
      ) VALUES (
        $1, $2, $3, NOW() + interval '${duration} hour',
        $4, $4, $5,
        '진행중', NOW(), ''
      ) RETURNING *;
    `, [
      user.user_key, 
      title,
      description,
      minPrice,
      bidStep
    ]);

    console.log('DB 등록 완료:', result.rows[0]);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ DB 등록 오류 발생:', err.message);
     res.status(500).json({ error: err.message });
  }
});

// 경매 리스트 데이터 API (마감 처리 포함)
router.get('/itemList/data', async (req, res) => {
  try {
    // ⏰ 마감된 경매 상태 변경
    await db.query(`
      UPDATE auction
      SET status = '마감'
      WHERE end_time < NOW() AND status = '진행중';
    `);

    const result = await db.query(`
      SELECT auction_key AS id, title, content, current_price, bid_unit,
        TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
        status
      FROM auction
      ORDER BY created_at DESC;
    `);

    const items = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      description: item.content,
      current: item.current_price,
      bidStep: item.bid_unit,
      end_time: item.end_time,
      status: item.status
    }));

    res.json(items);
  } catch (err) {
    console.error('DB 목록 불러오기 실패:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
