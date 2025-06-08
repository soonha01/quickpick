const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db');
const multer = require('multer');

// ✅ multer 설정: public/uploads 폴더에 저장
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + ext);
  }
});
const upload = multer({ storage });

// 경매 리스트 페이지
router.get('/itemList', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemList.html'));
});

// 경매 글쓰기 페이지
router.get('/itemWrite', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/itemWrite.html'));
});

// ✅ 경매 글 등록 처리 (이미지 업로드 포함)
router.post('/itemWrite', upload.single('image'), async (req, res) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const { title, description, duration, minPrice, bidStep } = req.body;

  // ✅ 이미지 파일이 있으면 URL로 저장, 없으면 빈 문자열
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const result = await db.query(`
      INSERT INTO auction (
        user_key, title, content, end_time,
        start_price, current_price, bid_unit,
        status, created_at, image_url
      ) VALUES (
        $1, $2, $3, (NOW() AT TIME ZONE 'Asia/Seoul') + interval '${duration} hour',
        $4, $4, $5,
        '진행중', NOW(), $6
      ) RETURNING *;
    `, [
      user.user_key,
      title,
      description,
      minPrice,
      bidStep,
      imageUrl
    ]);

  
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ DB 등록 오류 발생:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// 경매 리스트 데이터 API (마감 상태 업데이트 포함)
router.get('/itemList/data', async (req, res) => {
  try {
    await db.query(`
      UPDATE auction
      SET status = '마감'
      WHERE end_time <= (NOW() AT TIME ZONE 'Asia/Seoul') AND status = '진행중';
    `);

    const result = await db.query(`
      SELECT
        auction_key AS id,
        title,
        content,
        current_price,
        bid_unit,
        image_url,
        TO_CHAR(end_time, 'YYYY-MM-DD"T"HH24:MI:SS') AS end_time,
        status
      FROM auction
      ORDER BY created_at DESC;
    `);

    const items = result.rows.map(item => {
      let badgeClass;
      switch (item.status) {
        case '진행중':
          badgeClass = 'badge-success';
          break;
        case '마감':
          badgeClass = 'badge-danger';
          break;
        default:
          badgeClass = 'badge-light';
      }

      return {
        id: item.id,
        title: item.title,
        description: item.content,
        current: Number(item.current_price),
        bidStep: Number(item.bid_unit),
        end_time: item.end_time,
        status: item.status,
        badgeClass: badgeClass,
        imageUrl: item.image_url
      };
    });

    res.json(items);
  } catch (err) {
    console.error('DB 목록 불러오기 실패:', err);
    res.sendStatus(500);
  }
});

module.exports = router;




