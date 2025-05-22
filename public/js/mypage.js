window.addEventListener('DOMContentLoaded', () => {
  fetch('/mypage/userinfo')
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
  const display_name = document.getElementById('display_name').value;
  const phone_number = document.getElementById('phone_number').value;

  fetch('/mypage/update', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ display_name, phone_number })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('정보가 성공적으로 수정되었습니다.');
      } else {
        alert('수정 실패: ' + data.message);
      }
    })
    .catch(err => {
      console.error('정보 수정 실패:', err);
      alert('서버 오류가 발생했습니다.');
    });
});