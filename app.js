const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

//세션 설정
app.use(session({
  secret: 'your-secret-key',   // 실제 서비스에선 랜덤하고 복잡한 문자열 사용
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1시간
}));

// 정적 파일 경로 설정
app.use(express.static(path.join(__dirname, 'public')));

// Body 파서
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 라우터 연결
const loginRoute = require('./routes/login_route');
const chatRoute = require('./routes/chat_route');
const itemDetailRoute = require('./routes/itemDetail_route');
const itemListRoute = require('./routes/itemList_route');
const mypageRoute = require('./routes/mypage_route');
const myListRoute = require('./routes/myList_route');

// 라우터 등록
app.use('/', loginRoute);               // 예: /login, /register 등
app.use('/chat', chatRoute);           // 예: /chat/room, /chat/message 등
app.use('/item', itemDetailRoute);     // 예: /item/detail?id=123
app.use('/items', itemListRoute);      // 예: /items/list
app.use('/mypage', mypageRoute);       // 예: /mypage/profile, /mypage/settings 등
app.use('/mylist', myListRoute);

// 서버 시작
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
