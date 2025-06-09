const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/process-expired-auctions', async (req, res) => {
  try {
    // 마감 상태인데 채팅방이 없는 애들만 조회
    const expired = await db.query(`
      SELECT auction_key, user_key AS seller_id
      FROM auction
      WHERE status = '마감'
        AND auction_key NOT IN (
          SELECT auction_key FROM chatting
        )
    `);

    for (const { auction_key, seller_id } of expired.rows) {
      // 최고 입찰자 찾기
      const bidRes = await db.query(`
        SELECT user_key AS buyer_id
        FROM bid
        WHERE auction_key = $1
        ORDER BY price DESC
        LIMIT 1
      `, [auction_key]);

      const buyer_id = bidRes.rows[0]?.buyer_id;
      if (!buyer_id) continue;

      // 채팅 생성
      const newChat = await db.query(`
        INSERT INTO chatting (auction_key) VALUES ($1) RETURNING chat_key
      `, [auction_key]);

      const chat_key = newChat.rows[0].chat_key;

      await db.query(`
        INSERT INTO chattingRoom (chat_key, user_key, chat_content, chat_created_at)
        VALUES 
          ($1, $2, '', NOW()),
          ($1, $3, '', NOW())
      `, [chat_key, seller_id, buyer_id]);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ 채팅 생성 중 오류:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
