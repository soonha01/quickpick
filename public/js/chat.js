const socket = io();
let currentRoomId = null;

// 필터 버튼 이벤트 연결
document.getElementById('filter-all').onclick = () => loadRooms('전체');
document.getElementById('filter-bid').onclick = () => loadRooms('낙찰');
document.getElementById('filter-done').onclick = () => loadRooms('거래완료');

// 채팅방 목록 가져오기 함수
function loadRooms(filter = '전체') {
  fetch(`/chat/rooms?status=${filter}`)
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
}

// 초기 로딩
loadRooms();

// 메시지 수신
socket.on('chatMessage', (data) => {
  const messageBox = document.getElementById('messages');
  const p = document.createElement('p');
  const time = new Date().toLocaleString();
  p.textContent = `[${time}] ${data.userName || '익명'}: ${data.message}`;
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

  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message
  });

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
