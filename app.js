const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// ✅ 뷰 엔진 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 세션 설정
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1시간
}));

// 정적 파일 경로
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
const auctionCloseRoute = require('./routes/auctionClose_route');

app.use('/', loginRoute);
app.use('/chat', chatRoute);
app.use('/item', itemDetailRoute);
app.use('/items', itemListRoute);
app.use('/mypage', mypageRoute);
app.use('/mylist', myListRoute);
app.use('/auction', auctionCloseRoute);

// Socket.io 연결 로직
io.on('connection', (socket) => {
  socket.on('joinRoom', (chatRoomId) => {
    socket.join(chatRoomId);
  });

  socket.on('leaveRoom', (chatRoomId) => {
    socket.leave(chatRoomId);
  });

  socket.on('chatMessage', (data) => {
    const { chatRoomId, userName, message } = data;
    io.to(chatRoomId).emit('chatMessage', { userName, message });
  });

  // 입력 중 이벤트
  socket.on('typing', ({ chatRoomId, userName }) => {
    socket.to(chatRoomId).emit('typing', userName);
  });

  // 입력 멈춤 이벤트 추가
  socket.on('stopTyping', ({ chatRoomId, userName }) => {
    socket.to(chatRoomId).emit('stopTyping', userName);
  });

  socket.on('disconnect', () => {});
});

// 서버 시작
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 10초마다 자동 마감 처리 호출
setInterval(() => {
  fetch('http://localhost:3000/auction/process-expired-auctions', {
    method: 'POST'
  }).then(res => res.json())
    .then(json => console.log('[마감처리]', json))
    .catch(err => console.error('❌ 마감 처리 실패:', err));
}, 6000); // 10초
