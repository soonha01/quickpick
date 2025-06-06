const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// 최초 페이지
router.get('/myList', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/myList.html'));
});

// 로그인 체크 미들웨어
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  }
  next();
}

// 전체 내역 (판매 내역만 포함)
router.get('/myList/all', requireLogin, async (req, res) => {
  const userKey = req.session.user.user_key;

  try {
    const { rows: sells } = await db.query(
      `SELECT 
         a.auction_key AS id,
         a.title,
         a.start_price,
         a.current_price AS final_price,
         a.status,
         'sell' AS type
       FROM auction a
       WHERE a.user_key = $1
       ORDER BY a.created_at DESC`,
      [userKey]
    );

    res.json({ success: true, sells, bids: [] }); // bids는 없음
  } catch (err) {
         console.error('내 작성 글 조회 오류:', err);
         if (err.stack) console.error(err.stack);
         res.status(500).json({ success: false, message: '서버 오류 발생' });
}});

router.get('/mylist/bids', requireLogin, async (req, res) => {
  const userKey = req.session.user.user_key;

  try {
    const { rows } = await db.query(
      `SELECT 
         a.auction_key AS id,
         a.title, 
         b.price AS bid_price, 
         a.current_price,       
         a.status, 
         a.end_time 
       FROM bid b
       JOIN auction a ON b.auction_key = a.auction_key
       WHERE b.user_key = $1
       ORDER BY b.bid_time DESC`,
      [userKey]
    );

    res.json({ success: true, bids: rows });
  } catch (err) {
    console.error('내 입찰 내역 조회 오류:', err.stack || err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});


// 내 판매 내역 API
router.get('/myList/sells', requireLogin, async (req, res) => {
  const userKey = req.session.user.user_key;

  try {
    const { rows } = await db.query(
      `SELECT 
         a.auction_key AS id,
         a.title,
         a.start_price,
         a.current_price AS final_price,
         a.status
       FROM auction a
       WHERE a.user_key = $1
       ORDER BY a.created_at DESC`,
      [userKey]
    );

    res.json({ success: true, sells: rows });
  } catch (err) {
    console.error('내 판매 내역 조회 오류:', err.stack || err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});

module.exports = router;