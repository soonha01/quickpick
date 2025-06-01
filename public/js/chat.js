const socket = io();
let currentRoomId = null;

function getKSTISOString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 19).replace('T', ' ');
}

document.getElementById('filter-all').onclick = () => loadRooms('전체');
document.getElementById('filter-bid').onclick = () => loadRooms('낙찰');
document.getElementById('filter-done').onclick = () => loadRooms('거래완료');

function loadRooms(filter = '전체') {
  fetch(`/chat/rooms`)
    .then(res => res.json())
    .then(rooms => {
      const list = document.getElementById('roomList');
      list.innerHTML = '';

      rooms.forEach(room => {
        const status = room.status || '진행중';

        if (filter === '낙찰' && status !== '마감') return;
        if (filter === '거래완료' && status !== '거래완료') return;

        const div = document.createElement('div');
        div.className = 'chat-room-item';

        const titleSpan = document.createElement('span');
        titleSpan.textContent = `${room.title} 채팅방`;

        const badge = document.createElement('span');
        badge.className = 'badge badge-pill status-badge ' + (
          status === '마감' ? 'badge-primary' :
          status === '거래완료' ? 'badge-success' : 'badge-secondary'
        );
        badge.textContent = status;

        div.appendChild(titleSpan);
        div.appendChild(badge);

        div.onclick = () => {
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
      chat_content: message,
      created_at: getKSTISOString()
    })
  }).then(() => {
    input.value = '';
  });
}

function drawMessage(isMine, content, name, time) {
  const messageBox = document.getElementById('messages');

  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex mb-2 ' + (isMine ? 'justify-content-end' : 'justify-content-start');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
  bubble.innerHTML = `<div class="chat-meta">[${time}] ${name}</div><div>${content}</div>`;

  wrapper.appendChild(bubble);
  messageBox.appendChild(wrapper);
}
