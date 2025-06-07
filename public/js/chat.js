console.log('✅ chat.js 로딩됨');

const socket = io();
let currentRoomId = null;

function getKSTISOString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 19).replace('T', ' ');
}

function loadRooms() {
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
          //기존 방 나가기
          if (currentRoomId) {
            socket.emit('leaveRoom', currentRoomId);
          }

          //새 방 입장
          currentRoomId = room.chat_key;
          socket.emit('joinRoom', currentRoomId);

          const messageBox = document.getElementById('messages');
          messageBox.innerHTML = '';

          fetch(`/chat/messages/${room.chat_key}`)
            .then(res => res.json())
            .then(messages => {
              messages.forEach(msg =>
                drawMessage(msg.display_name === userName, msg.chat_content, msg.display_name, msg.send_time)
              );
              messageBox.scrollTop = messageBox.scrollHeight;
            });
        };

        list.appendChild(div);
      });
    });
}

loadRooms();

//서버로부터 실시간 메시지 수신
socket.on('chatMessage', (data) => {
  if (!currentRoomId) return;

  const now = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  });

  drawMessage(data.userName === userName, data.message, data.userName, now);
});

// ✅ 메시지 보내기
document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  if (!message || !currentRoomId) return;

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

  // 실시간 전송
  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message
  });

  // 내 메시지는 바로 렌더링
  drawMessage(true, message, userName, time);

  // DB 저장
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

//메시지 UI 생성
function drawMessage(isMine, content, name, time) {
  const messageBox = document.getElementById('messages');

  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex mb-2 ' + (isMine ? 'justify-content-end' : 'justify-content-start');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
  bubble.innerHTML = `<div class="chat-meta">[${time}] ${name}</div><div>${content}</div>`;

  wrapper.appendChild(bubble);
  messageBox.appendChild(wrapper);
  messageBox.scrollTop = messageBox.scrollHeight;
}
