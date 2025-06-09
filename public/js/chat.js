const socket = io(); // Socket.IO를 통해 서버와 실시간 연결
let currentRoomId = null; // 현재 접속 중인 채팅방 ID 저장용 변수

// 현재 시간을 KST 기준 ISO 문자열로 반환하는 함수 (DB 저장용)
function getKSTISOString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 19).replace('T', ' ');
}

// 채팅방 목록을 서버에서 불러와 화면에 출력하는 함수
function loadRooms() {
  fetch(`/chat/rooms`)
    .then(res => res.json())
    .then(rooms => {
      const list = document.getElementById('roomList');
      list.innerHTML = ''; // 기존 목록 초기화

      rooms.forEach(room => {
        const div = document.createElement('div');
        div.className = 'chat-room-item';
        div.textContent = `${room.title} 채팅방`;

        // 채팅방 클릭 시 해당 방으로 접속
        div.onclick = () => {
          if (currentRoomId) {
            socket.emit('leaveRoom', currentRoomId); // 기존 방 나가기
          }

          currentRoomId = room.chat_key;
          socket.emit('joinRoom', currentRoomId); // 새로운 방 입장

          const messageBox = document.getElementById('messages');
          messageBox.innerHTML = ''; // 메시지창 초기화

          // 기존 메시지 불러오기
          fetch(`/chat/messages/${room.chat_key}`)
            .then(res => res.json())
            .then(messages => {
              messages.forEach(msg =>
                drawMessage(msg.display_name === userName, msg.chat_content, msg.display_name, msg.send_time)
              );
              messageBox.scrollTop = messageBox.scrollHeight; // 스크롤 하단으로 이동
            });
        };

        list.appendChild(div); // 채팅방 목록에 추가
      });
    });
}

loadRooms(); // 페이지 로딩 시 채팅방 목록 자동 로드

// 실시간으로 수신된 채팅 메시지를 화면에 표시
socket.on('chatMessage', (data) => {
  if (!currentRoomId) return; // 방이 선택되지 않은 경우 무시

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

  const oldNotice = document.getElementById('typingNotice'); // 입력 중 알림 제거
  if (oldNotice) oldNotice.remove();

  drawMessage(data.userName === userName, data.message, data.userName, now); // 메시지 출력
});

// 버튼 또는 Enter 키로 메시지 전송 이벤트 바인딩
document.getElementById('sendMessage').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// 입력창에 내용이 생기면 '입력 중' 알림 전송
document.getElementById('messageInput').addEventListener('input', () => {
  const inputValue = document.getElementById('messageInput').value.trim();

  if (!currentRoomId || !userName) return;

  if (inputValue.length === 0) {
    const el = document.getElementById('typingNotice'); // 내용 없으면 알림 제거
    if (el) el.remove();
  } else {
    socket.emit('typing', { chatRoomId: currentRoomId, userName }); // 입력 중 상태 알림 전송
  }
});

// 메시지 전송 함수
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

  // 서버로 실시간 메시지 전송
  socket.emit('chatMessage', {
    chatRoomId: currentRoomId,
    userName: String(userName),
    message
  });

  drawMessage(true, message, userName, time); // 본인 메시지 화면에 출력

  // DB에도 메시지 저장
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
    input.value = ''; // 입력창 비우기
  });
}

// 메시지를 화면에 출력하는 함수
function drawMessage(isMine, content, name, time) {
  const messageBox = document.getElementById('messages');

  const oldNotice = document.getElementById('typingNotice'); // 입력 중 알림 제거
  if (oldNotice) oldNotice.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex mb-2 ' + (isMine ? 'justify-content-end' : 'justify-content-start');

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (isMine ? 'chat-right' : 'chat-left');
  bubble.innerHTML = `<div class="chat-meta">[${time}] ${name}</div><div>${content}</div>`;

  wrapper.appendChild(bubble);
  messageBox.appendChild(wrapper);
  messageBox.scrollTop = messageBox.scrollHeight; // 스크롤 하단으로 이동
}

// 입력 중 알림 수신 시 화면에 표시
socket.on('typing', (name) => {
  if (name === userName) return; // 본인 제외

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

  clearTimeout(window.typingTimeout); // 이전 타이머 제거
  window.typingTimeout = setTimeout(() => {
    const el = document.getElementById('typingNotice'); // 일정 시간 후 알림 제거
    if (el) el.remove();
  }, 1000);
});
