window.addEventListener('DOMContentLoaded', () => {
  fetch('/mypage/userinfo', {
    method: 'GET',
    credentials: 'include' // 쿠키 포함해서 세션 유지
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('display_name').value = data.display_name;
        document.getElementById('phone_number').value = data.phone_number;
      } else {
        alert('로그인이 필요합니다.');
        window.location.href = '/login';
      }
    })
    .catch(err => {
      console.error('유저 정보 불러오기 실패:', err);
    });
});

// 수정하기 버튼 클릭 시
document.getElementById('profileForm').addEventListener('submit', (e) => {
  e.preventDefault();
  console.log('폼 제출됨'); // ✅ 이거 추가

  const display_name = document.getElementById('display_name').value;
  const phone_number = document.getElementById('phone_number').value;

  fetch('/mypage/update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ display_name, phone_number })
  })
    .then(res => res.json())
    .then(data => {
      console.log('응답:', data); // ✅ 이것도 추가
      if (data.success) {
        alert('정보가 성공적으로 수정되었습니다.');
        const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = display_name;
      }
      } else {
        alert('수정 실패: ' + data.message);
      }
    })
    .catch(err => {
      console.error('정보 수정 실패:', err);
      alert('서버 오류가 발생했습니다.');
    });
});

document.getElementById('check-duplicate-btn').addEventListener('click', () => {
  const displayName = document.getElementById('display_name').value.trim();

  if (!displayName) {
    alert('닉네임을 입력하세요.');
    return;
  }

  fetch(`/mypage/check-duplicate?field=display_name&value=${encodeURIComponent(displayName)}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        if (data.duplicate) {
          alert('이미 사용 중인 닉네임입니다.');
        } else {
          alert('사용 가능한 닉네임입니다.');
        }
      } else {
        alert('확인 실패: ' + data.message);
      }
    })
    .catch(err => {
      console.error('중복 확인 실패:', err);
      alert('서버 오류가 발생했습니다.');
    });
});