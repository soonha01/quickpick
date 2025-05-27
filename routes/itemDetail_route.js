const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

// 상세 HTML 파일
router.get('/itemDetail', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemDetail.html'));
});

// 상세 데이터 JSON API (시간 포맷 수정: UTC 포맷 그대로)
router.get('/itemDetail/data', async (req, res) => {
  const id = req.query.id;

  try {
    // ✅ 먼저 마감 상태 갱신
    await db.query(`
      UPDATE auction
      SET status = '마감'
      WHERE end_time < NOW() AND status = '진행중';
    `);
    // ✅ 상세 데이터 조회
    const result = await db.query(`
      SELECT 
      title, content, current_price, bid_unit, 
      TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
      status, user_key, image_url
      FROM auction
      WHERE auction_key = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.json({ error: '경매글 없음' });
    }

    const item = result.rows[0];
    const loginUserKey = req.session.user?.user_key || null;

    res.json({
      title: item.title,
      content: item.content,
      current_price: item.current_price,
      bid_unit: item.bid_unit,
      end_time: item.end_time, // ← UTC 포맷 그대로
      status: item.status,
      writerKey: item.user_key,
      loginUserKey: loginUserKey,
      imageUrl: item.image_url
    });
  } catch (err) {
    console.error('❌ itemDetail/data 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});
//입찰버튼
router.post('/itemDetail/bid', async (req, res) => {
  const itemId = req.body.id;
  const loginUserKey = req.session.user?.user_key;

  if (!loginUserKey) {
    return res.status(401).send('로그인이 필요합니다.');
  }

  try {
    const result = await db.query(`
      SELECT current_price, bid_unit, status, user_key
      FROM auction
      WHERE auction_key = $1
    `, [itemId]);

    if (result.rows.length === 0) return res.status(404).send('글 없음');
    const item = result.rows[0];

    // ✅ 본인이 작성한 글인지 확인
    if (item.user_key === loginUserKey) {
      return res.status(400).json({ message: '자신의 글에는 입찰할 수 없습니다.' });
    }

    if (item.status !== '진행중') {
      return res.status(400).json({ message: '마감된 경매입니다.' }); // ← 이걸로 바꾸기!
    }

    const newPrice = Number(item.current_price) + Number(item.bid_unit);

    await db.query(`
      UPDATE auction SET current_price = $1
      WHERE auction_key = $2
    `, [newPrice, itemId]);

    res.json({ current_price: newPrice });
  } catch (err) {
    console.error('입찰 처리 실패:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
