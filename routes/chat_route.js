const express = require('express');
const router = express.Router();
const db = require('../db');

// dayjs 설정
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
require('dayjs/locale/ko');
dayjs.extend(utc);         // UTC 확장 기능 추가
dayjs.extend(timezone);    // 타임존 처리 기능 추가
dayjs.locale('ko');        // 한국어 로케일 설정

// 채팅 페이지 렌더링
router.get('/room', (req, res) => {
  const user = req.session.user; // 세션에서 로그인 유저 정보 가져오기
  if (!user) return res.redirect('/login'); // 로그인 안 되어 있으면 로그인 페이지로 리다이렉트

  // EJS 템플릿으로 chat.ejs 페이지 렌더링
  res.render('chat', {
    userKey: user.user_key,
    userName: user.display_name
  });
});

// 채팅방 리스트 가져오기 (로그인된 유저가 속한 방만)
router.get('/rooms', async (req, res) => {
  const loginUserKey = req.session.user?.user_key;
  if (!loginUserKey) return res.status(401).json({ error: '로그인이 필요합니다.' });

  try {
    const result = await db.query(`
      SELECT DISTINCT ON (c.chat_key)
        c.chat_key,
        a.title
      FROM chattingRoom cr
      JOIN chatting c ON cr.chat_key = c.chat_key
      JOIN auction a ON c.auction_key = a.auction_key
      WHERE cr.user_key = $1
      ORDER BY c.chat_key, cr.chat_created_at DESC
    `, [loginUserKey]);

    // 응답 형식 맞춰 가공
    const rooms = result.rows.map(room => ({
      chat_key: room.chat_key,
      title: `${room.title} 경매방`
    }));

    res.json(rooms); // JSON 형태로 채팅방 목록 응답
  } catch (err) {
    console.error('채팅방 조회 실패:', err);
    res.status(500).json({ error: '채팅방을 불러오지 못했습니다.' });
  }
});

// 특정 채팅방의 메시지 가져오기 (KST 시간으로 변환해서 보내줌)
router.get('/messages/:chat_key', async (req, res) => {
  const chat_key = req.params.chat_key;

  try {
    const result = await db.query(`
      SELECT 
        cr.chat_content, 
        cr.chat_created_at AS send_time, 
        u.display_name
      FROM chattingRoom cr
      JOIN users u ON cr.user_key = u.user_key
      WHERE cr.chat_key = $1
      ORDER BY cr.chat_created_at ASC
    `, [chat_key]);

    // 시간 포맷을 KST 기준으로 변환
    const messages = result.rows.map(row => ({
      chat_content: row.chat_content,
      display_name: row.display_name,
      send_time: dayjs.utc(row.send_time).tz('Asia/Seoul').format('YYYY. M. D. A h:mm:ss')
    }));

    res.json(messages); // 채팅 메시지 목록 반환
  } catch (err) {
    console.error('메시지 조회 실패:', err);
    res.status(500).json({ error: '메시지를 불러오지 못했습니다.' });
  }
});

// 채팅 메시지 저장
router.post('/save', async (req, res) => {
  const { user_key, chat_key, chat_content, created_at } = req.body;

  try {
    await db.query(`
      INSERT INTO chattingRoom (chat_key, user_key, chat_content, chat_created_at)
      VALUES ($1, $2, $3, $4)
    `, [chat_key, user_key, chat_content, created_at]);

    res.sendStatus(200); // 저장 성공 응답
  } catch (err) {
    console.error('메시지 저장 실패:', err);
    res.status(500).json({ error: '메시지를 저장하지 못했습니다.' });
  }
});

module.exports = router; // 외부에서 사용할 수 있도록 라우터 내보내기
