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
    // ✅ 마감 상태 갱신
    await db.query(`
      UPDATE auction
      SET status = '마감'
      WHERE end_time < NOW() AND status = '진행중';
    `);

    // ✅ 상세 데이터 조회
    const result = await db.query(`
      SELECT 
        title, content, current_price, bid_unit, 
        TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_time,
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
      end_time: item.end_time,
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

// ✅ 입찰 처리
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

    if (item.user_key === loginUserKey) {
      return res.status(400).json({ message: '자신의 글에는 입찰할 수 없습니다.' });
    }

    if (item.status !== '진행중') {
      return res.status(400).json({ message: '마감된 경매입니다.' });
    }


    const prevPrice = Number(item.current_price);
    const newPrice = Number(item.current_price) + Number(item.bid_unit);


    // ✅ 입찰 중복 방지를 위한 조건부 업데이트
    const updateResult = await db.query(`
      UPDATE auction
      SET current_price = $1, top_bidder = $2
      WHERE auction_key = $3 AND current_price = $4
    `, [newPrice, loginUserKey, itemId, prevPrice]);

    if (updateResult.rowCount === 0) {
      return res.status(400).json({
        message: '⚠️ 다른 사용자가 먼저 입찰했습니다. 페이지를 새로고침 해주세요.'
      });
    }

    // ✅ 최고가 및 top_bidder 업데이트
    await db.query(`
      UPDATE auction
      SET current_price = $1, top_bidder = $2
      WHERE auction_key = $3
    `, [newPrice, loginUserKey, itemId]);

    // ✅ 입찰 기록 저장 (user_id → user_key로 수정)
    await db.query(`
      INSERT INTO bid (auction_key, user_key, price, bid_time)
      VALUES ($1, $2, $3, NOW())
    `, [itemId, loginUserKey, newPrice]);

    res.json({ current_price: newPrice });
  } catch (err) {
    console.error('입찰 처리 실패:', err);
    res.sendStatus(500);
  }
});

module.exports = router;
