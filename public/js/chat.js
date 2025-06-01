const socket = io();
let currentRoomId = null;

// KST 기준 시간 포맷 문자열 생성 함수
function getKSTISOString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC + 9
  return kst.toISOString().slice(0, 19).replace('T', ' ');  // 'YYYY-MM-DD HH:mm:ss'
}

// 필터 버튼 이벤트 연결
document.getElementById('filter-all').onclick = () => loadRooms('전체');
document.getElementById('filter-bid').onclick = () => loadRooms('낙찰');
document.getElementById('filter-done').onclick = () => loadRooms('거래완료');

// 채팅방 목록 가져오기 함수
function loadRooms(filter = '전체') {
  fetch(`/chat/rooms`)
    .then(res => res.json())
    .then(rooms => {
      const list = document.getElementById('roomList');
      list.innerHTML = '';

      rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'chat-room-item';
        div.textContent = `${room.title} 채팅방`;

        div.onclick = () => {
          currentRoomId = room.chat_key;
          socket.emit('joinRoom', currentRoomId);

          const messageBox = document.getElementById('messages');
          messageBox.innerHTML = '';

          fetch(`/chat/messages/${room.chat_key}`)
            .then(res => res.json())
            .then(messages => {
              messages.forEach(msg => {
                const isMine = msg.user_key === userKey;

                const messageDiv = document.createElement('div');
                messageDiv.className = 'chat-message d-flex flex-column ' +
                  (isMine ? 'align-items-end' : 'align-items-start');

                const meta = document.createElement('div');
                meta.className = 'chat-meta';
                meta.textContent = `[${msg.send_time}] ${msg.display_name}`;

                const bubble = document.createElement('div');
                bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
                bubble.textContent = msg.chat_content;

                messageDiv.appendChild(meta);
                messageDiv.appendChild(bubble);
                messageBox.appendChild(messageDiv);
              });

              messageBox.scrollTop = messageBox.scrollHeight;
            });
        };

        list.appendChild(div);
      });
    });
}

// 초기 로딩
loadRooms();

// 메시지 수신
socket.on('chatMessage', (data) => {
  const messageBox = document.getElementById('messages');

  // 한국 시간 포맷
  const time = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });

  const isMine = data.userName === userName;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message d-flex flex-column ' + (isMine ? 'align-items-end' : 'align-items-start');

  const meta = document.createElement('div');
  meta.className = 'chat-meta';
  meta.textContent = `[${time}] ${data.userName}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
  bubble.textContent = data.message;

  messageDiv.appendChild(meta);
  messageDiv.appendChild(bubble);
  messageBox.appendChild(messageDiv);
  messageBox.scrollTop = messageBox.scrollHeight;
});

// 메시지 전송
document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message || !currentRoomId) return;

  // 서버로 메시지 전송
  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message
  });

  // DB에 메시지 저장
  fetch('/chat/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_key: userKey,
      chat_key: currentRoomId,
      chat_content: message,
      created_at: getKSTISOString()
    })
  }).then(() => {
    input.value = '';
  });
}
