const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

// 최초 페이지
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/main.html'));
});


// 로그인한 상태인지 세션 체크
router.get('/session-user', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

// 로그인 페이지 이동
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// 로그인
router.post('/login', async (req, res) => {
  const { login_id, password } = req.body;

  try {
    const query = 'SELECT * FROM users WHERE login_id = $1 AND password = $2';
    const values = [login_id, password];

    const result = await db.query(query, values);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      req.session.user = {
        user_key: user.user_key,
        login_id: user.login_id,
        display_name: user.display_name,
        phone_number: user.phone_number,
        profile_image: user.profile_image  //여기 추가
      };

      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' });
    }
  } catch (err) {
    console.error('로그인 DB 오류:', err);
    res.status(500).json({ success: false, message: '서버 오류 발생' });
  }
});


// 아이디 또는 닉네임 중복 확인 (login_id, display_name 기준)
router.get('/check-duplicate', async (req, res) => {
  const { field, value } = req.query;

  // 허용 필드만 검사
  const fieldMap = {
    login_id: 'login_id',
    display_name: 'display_name' 
  };

  const dbField = fieldMap[field];
  if (!dbField) {
    return res.status(400).json({ error: '잘못된 필드입니다.' });
  }

  try {
    const result = await db.query(
      `SELECT 1 FROM users WHERE ${dbField} = $1 LIMIT 1`, [value]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    console.error('❌ 중복 확인 에러:', err);
    res.status(500).json({ error: 'DB 오류' });
  }
});

//회원가입 처리
router.post('/register', async (req, res) => {
  const { login_id, display_name, phone_number, password } = req.body;

  try {
    const dup = await db.query(
      'SELECT 1 FROM users WHERE login_id = $1 OR display_name = $2',
      [login_id, display_name]
    );

    if (dup.rows.length > 0) {
      return res.status(409).json({ success: false, message: '아이디 또는 닉네임 중복' });
    }

    await db.query(`
      INSERT INTO users (login_id, display_name, phone_number, password)
      VALUES ($1, $2, $3, $4)
    `, [login_id, display_name, phone_number, password]);

    res.json({ success: true });

  } catch (err) {
    console.error('회원가입 오류:', err);
    res.status(500).json({ success: false, message: 'DB 오류' });
  }
});

// 로그아웃 처리
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('로그아웃 오류:', err);
      return res.status(500).send('Logout failed');
    }
    res.redirect('/login'); // 로그인 페이지로 이동
  });
});





module.exports = router;
