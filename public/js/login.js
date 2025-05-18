document.getElementById('loginBtn').addEventListener('click', function () {
  const login_id = document.getElementById('login_id').value;
  const password = document.getElementById('password').value;

  fetch('/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ login_id, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('로그인 성공!');
        location.href = '/items/itemList';

      } else {
        alert('로그인 실패: ' + data.message);
      }
    })
    .catch(err => {
      console.error('에러 발생:', err);
      alert('서버 오류 발생');
    });
});
