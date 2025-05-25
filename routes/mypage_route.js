const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');

// HTML 제공
router.get('/mypage', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/mypage.html'));
});

// 사용자 정보 조회
router.get('/userinfo', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: '로그인 필요' });
  }


  try {
    const result = await db.query(
      'SELECT display_name, phone_number FROM users WHERE user_key = $1',
      [req.session.user.user_key]   // ✅ 수정됨
    );

    if (result.rows.length > 0) {
      const { display_name, phone_number } = result.rows[0];
      return res.json({ success: true, display_name, phone_number });
    } else {
      return res.status(404).json({ success: false, message: '사용자 정보 없음' });
    }

  } catch (err) {
    console.error('사용자 정보 조회 오류:', err);
    return res.status(500).json({ success: false, message: '서버 오류' });
  }
});

// 사용자 정보 수정
router.patch('/update', async (req, res) => {
  const { display_name, phone_number } = req.body;

  if (!req.session.user) {
    return res.status(401).json({ success: false, message: '로그인 필요' });
  }

  try {
    await db.query(
      'UPDATE users SET display_name = $1, phone_number = $2 WHERE user_key = $3',
      [display_name, phone_number, req.session.user.user_key]
    );

    // 세션 정보도 갱신
    req.session.user.display_name = display_name;

    res.json({ success: true });
  } catch (err) {
    console.error('정보 수정 오류:', err);
    res.status(500).json({ success: false, message: 'DB 오류' });
  }
});

router.get('/check-duplicate', async (req, res) => {
  const { field, value } = req.query;

  const allowedFields = ['display_name'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: '잘못된 필드' });
  }

  try {
    const query = `SELECT COUNT(*) FROM users WHERE ${field} = $1`;
    const result = await db.query(query, [value]);

    const isDuplicate = parseInt(result.rows[0].count) > 0;
    res.json({ success: true, duplicate: isDuplicate });
  } catch (err) {
    console.error('중복 확인 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류' });
  }
});

module.exports = router;
