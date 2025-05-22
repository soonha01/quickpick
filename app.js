const express = require('express');
const session = require('express-session');
const path = require('path');
const http = require('http');                //추가
const socketIo = require('socket.io');       //추가

const app = express();
const server = http.createServer(app);       //기존 app → server로 변경
const io = socketIo(server);                 //소켓 서버 생성

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

app.use('/', loginRoute);
app.use('/chat', chatRoute);
app.use('/item', itemDetailRoute);
app.use('/items', itemListRoute);
app.use('/mypage', mypageRoute);
app.use('/mylist', myListRoute);

//Socket.io 연결 로직 추가
io.on('connection', (socket) => {
  console.log('유저 접속됨');

  socket.on('joinRoom', (chatRoomId) => {
    socket.join(chatRoomId);
    console.log(`채팅방 ${chatRoomId} 입장`);
  });

  socket.on('chatMessage', (data) => {
    const { chatRoomId, userName, message } = data;
    console.log(`메시지 수신 [${chatRoomId}] ${userName}: ${message}`);

    // 모든 사용자에게 메시지 전송
    io.to(chatRoomId).emit('chatMessage', { userName, message });
  });

  socket.on('disconnect', () => {
    console.log('유저 나감');
  });
});

// 서버 시작
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});