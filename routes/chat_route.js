const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// 채팅 화면
router.get('/chat', (req, res) => {
  const user = req.session.user || { user_key: 1, display_name: '테스트유저' };

  const userScript = `
    <script>
      const userKey = ${user.user_key};
      const userName = "${(user.display_name || '익명').replace(/"/g, '\\"')}";
    </script>
  `;

  res.sendFile(path.join(__dirname, '../public/chat.html'), {}, function (err) {
    if (!err) {
      res.write(userScript);
      res.end();
    }
  });
});

// 채팅방 목록 조회
router.get('/rooms', async (req, res) => {
  const userKey = req.session.user?.user_key || 1;

  try {
    const result = await db.query(`
      SELECT DISTINCT ON (c.chat_key) cr.chat_key, c.auction_key, a.title
      FROM "chattingRoom" cr
      JOIN chatting c ON cr.chat_key = c.chat_key
      JOIN auction a ON c.auction_key = a.auction_key
      WHERE cr.user_key = $1
      ORDER BY c.chat_key, cr.chat_created_at DESC
    `, [userKey]);

    console.log('[✅ 채팅방 목록]', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ 채팅방 조회 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

// 메시지 저장 API
router.post('/save', async (req, res) => {
  const { chat_key, user_key, chat_content } = req.body;

  try {
    const result = await db.query(`
      INSERT INTO "chattingRoom" (chat_key, user_key, chat_content, chat_created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (chat_key, user_key)
      DO UPDATE SET 
        chat_content = EXCLUDED.chat_content,
        chat_created_at = EXCLUDED.chat_created_at
      RETURNING *;
    `, [chat_key, user_key, chat_content]);

    console.log('[✅ 메시지 저장 완료]', result.rows[0]);
    res.status(200).json({ message: '저장 완료', saved: result.rows[0] });
  } catch (err) {
    console.error('❌ 채팅 저장 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});


// 채팅 메시지 불러오기
router.get('/messages/:chat_key', async (req, res) => {
  const chatKey = req.params.chat_key;

  try {
    const result = await db.query(`
      SELECT cr.chat_content, cr.chat_created_at AS send_time
      FROM "chattingRoom" cr
      WHERE cr.chat_key = $1
      ORDER BY cr.chat_created_at ASC;
    `, [chatKey]);

    res.json(result.rows);
  } catch (err) {
    console.error('❌ 채팅 불러오기 에러:', err);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;
