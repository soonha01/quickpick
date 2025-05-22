const socket = io();
let currentRoomId = null;

// 채팅방 목록 불러오기
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
        document.getElementById('messages').innerHTML = '';

        // 채팅 메시지 불러오기
        fetch(`/chat/messages/${room.chat_key}`)
          .then(res => res.json())
          .then(messages => {
            const messageBox = document.getElementById('messages');
            messages.forEach(msg => {
              const p = document.createElement('p');
              p.textContent = `${msg.chat_content}`;
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
  p.textContent = `${data.userName || '익명'}: ${data.message}`;
  messageBox.appendChild(p);
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

  // 실시간 전송
  socket.emit('chatMessage', {
  chatRoomId: currentRoomId,
  userName: String(userName), // 강제로 문자열 변환
  message
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
