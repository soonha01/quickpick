//중복확인 함수
function checkDuplicate(field) {
  const value = document.getElementById(field === 'login_id' ? 'login_id' : 'display_name').value;

  if (!value) {
    alert('값을 입력하세요.');
    return;
  }

  fetch(`/check-duplicate?field=${field}&value=${encodeURIComponent(value)}`)
    .then(res => res.json())
    .then(data => {
      if (data.exists) {
        alert('❌ 이미 사용 중인 값입니다.');
      } else {
        alert('✅ 사용 가능한 값입니다.');
      }
    })
    .catch(err => {
      console.error('중복 확인 오류:', err);
      alert('중복 확인 중 오류 발생');
    });
}



document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
      login_id: document.getElementById('login_id').value,
      display_name: document.getElementById('display_name').value,
      phone_number: form.phone_number.value,
      password: form.password.value,
      password_confirm: form.password_confirm.value
    };

    if (formData.password !== formData.password_confirm) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        alert('회원가입 완료!');
        window.location.href = '/login';
      } else {
        alert(data.message || '회원가입 실패');
      }
    } catch (err) {
      console.error('❌ 회원가입 실패:', err);
      alert('서버 오류 발생');
    }
  });
});


