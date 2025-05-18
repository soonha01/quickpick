const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

// 상세 HTML 파일
router.get('/itemDetail', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemDetail.html'));
});

// 상세 데이터 JSON API
router.get('/itemDetail/data', async (req, res) => {
  const itemId = req.query.id;
  console.log('[✅ 요청 도착] ID:', itemId);

  try {
    const result = await db.query(`
      SELECT title, content, current_price, bid_unit, status,
             TO_CHAR(end_time, 'YYYY-MM-DD HH24:MI:SS') AS end_time
      FROM auction
      WHERE auction_key = $1
    `, [itemId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '해당 경매글이 없습니다.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('상세 조회 실패:', err);
    res.sendStatus(500);
  }
});

//입찰버튼
router.post('/itemDetail/bid', async (req, res) => {
  const itemId = req.body.id;

  try {
    const result = await db.query(`
      SELECT current_price, bid_unit, status
      FROM auction
      WHERE auction_key = $1
    `, [itemId]);

    if (result.rows.length === 0) return res.status(404).send('글 없음');
    const item = result.rows[0];

    if (item.status !== '진행중') {
      return res.status(400).send('경매 마감됨');
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
