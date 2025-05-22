const socket = io();
let currentRoomId = null;

// 채팅방 목록 가져오기
fetch('/chat/rooms')
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

        // 메시지 초기화
        const messageBox = document.getElementById('messages');
        messageBox.innerHTML = '';

        // 메시지 불러오기
        fetch(`/chat/messages/${room.chat_key}`)
          .then(res => res.json())
          .then(messages => {
            messages.forEach(msg => {
              const p = document.createElement('p');
              const time = new Date(msg.send_time).toLocaleString();
              p.textContent = `[${time}] ${msg.chat_content}`;
              messageBox.appendChild(p);
            });
            messageBox.scrollTop = messageBox.scrollHeight;
          });
      };

      list.appendChild(div);
    });
  });

// 메시지 수신
socket.on('chatMessage', (data) => {
  const messageBox = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date().toLocaleString();
  p.textContent = `[${time}] ${data.userName || '익명'}: ${data.message}`;
  messageBox.appendChild(p);
  messageBox.scrollTop = messageBox.scrollHeight;
});

// 메시지 전송 이벤트
document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// 메시지 전송 함수
function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message || !currentRoomId) return;

  // 콘솔 디버깅 로그
  console.log('[전송할 메시지]', message);

  // 실시간 전송
  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message: message
  });

  // DB 저장
  fetch('/chat/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_key: userKey,
      chat_key: currentRoomId,
      chat_content: message
    })
  }).then(() => {
    input.value = '';
  });
}
