const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

const items = [];  // 메모리에 저장할 임시 목록


// 최초 페이지
router.get('/itemList', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemList.html'));
});

router.get('/itemWrite', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemWrite.html'));
});

router.post('/itemWrite', async (req, res) => {
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
      1, // user_key 고정 (테스트용)
      title,
      description,
      minPrice,
      bidStep
    ]);

    console.log('DB 등록 완료:', result.rows[0]);
    res.sendStatus(200);
  } catch (err) {
    console.error('DB 등록 오류:', err);
    res.sendStatus(500);
  }
});

//GET 요청으로 리스트를 받아올 수 있는 API 만들기
router.get('/itemList/data', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT auction_key AS id, title, content, current_price, bid_unit,  -- ✅ 여기 포함됐는지 확인
        TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
        status
      FROM auction
      ORDER BY created_at DESC
`);

    console.log(result.rows); // 👀 확인용 로그

    const items = result.rows.map(item => ({
      id: item.id,
      title: item.title,
      description: item.content,
      current: item.current_price,   // ✅ 명확한 이름
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