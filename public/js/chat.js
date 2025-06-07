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
          if (currentRoomId) {
            socket.emit('leaveRoom', currentRoomId);
          }

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

  // 기존 입력 중 알림 제거
  const oldNotice = document.getElementById('typingNotice');
  if (oldNotice) oldNotice.remove();

  drawMessage(data.userName === userName, data.message, data.userName, now);
});

// ✅ 메시지 보내기
document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

document.getElementById('messageInput').addEventListener('input', () => {
  const inputValue = document.getElementById('messageInput').value.trim();

  if (!currentRoomId || !userName) return;

  if (inputValue.length === 0) {
    // 입력창이 비어 있으면 알림 즉시 제거
    const el = document.getElementById('typingNotice');
    if (el) el.remove();
  } else {
    // 입력값이 있으면 타이핑 알림 전송
    socket.emit('typing', { chatRoomId: currentRoomId, userName });
  }
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

  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message
  });

  drawMessage(true, message, userName, time);

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

function drawMessage(isMine, content, name, time) {
  const messageBox = document.getElementById('messages');

  // 입력 중 알림 제거
  const oldNotice = document.getElementById('typingNotice');
  if (oldNotice) oldNotice.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex mb-2 ' + (isMine ? 'justify-content-end' : 'justify-content-start');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
  bubble.innerHTML = `<div class="chat-meta">[${time}] ${name}</div><div>${content}</div>`;

  wrapper.appendChild(bubble);
  messageBox.appendChild(wrapper);
  messageBox.scrollTop = messageBox.scrollHeight;
}

socket.on('typing', (name) => {
  if (name === userName) return;

  const messageBox = document.getElementById('messages');

  let notice = document.getElementById('typingNotice');
  if (!notice) {
    notice = document.createElement('div');
    notice.id = 'typingNotice';
    notice.textContent = `${name}님이 입력 중입니다...`;
    notice.style.backgroundColor = '#ffd3d3';
    notice.style.color = '#000';
    notice.style.padding = '10px';
    notice.style.margin = '8px 10px';
    notice.style.borderRadius = '10px';
    notice.style.fontWeight = 'bold';
    notice.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    notice.style.textAlign = 'left';
    messageBox.appendChild(notice);
  }

  messageBox.scrollTop = messageBox.scrollHeight;

  clearTimeout(window.typingTimeout);
  window.typingTimeout = setTimeout(() => {
    const el = document.getElementById('typingNotice');
    if (el) el.remove();
  }, 1000); // 1초 후 사라지도록 변경
});


