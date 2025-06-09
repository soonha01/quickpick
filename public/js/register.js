// 중복확인 함수
function checkDuplicate(field) {
  const value = document.getElementById(field === 'login_id' ? 'login_id' : 'display_name').value;

if (!value) {
  if (field === 'login_id') {
    alert('아이디를 입력하세요.');
  } else {
    alert('닉네임을 입력하세요.');
  }
  return;
}

fetch(`/check-duplicate?field=${field}&value=${encodeURIComponent(value)}`)
  .then(res => res.json())
  .then(data => {
    if (data.exists) {
      if (field === 'login_id') {
        alert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
      } else {
        alert('이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.');
      }
    } else {
      if (field === 'login_id') {
        alert('사용 가능한 아이디입니다!');
      } else {
        alert('사용 가능한 닉네임입니다!');
      }
    }
  })
  .catch(err => {
    console.error('중복 확인 오류:', err);
    alert('중복 확인 중 오류가 발생했습니다.');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const phoneInput = document.getElementById('phone_number');

  // ✅ 휴대폰 번호 자동 하이픈 처리 + 숫자만 허용
  if (phoneInput) {
    phoneInput.addEventListener('input', function (e) {
      let value = e.target.value.replace(/\D/g, ''); // 숫자만 남김

      if (value.length <= 3) {
        e.target.value = value;
      } else if (value.length <= 7) {
        e.target.value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
      } else {
        e.target.value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
      }
    });
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const termsChecked = document.getElementById('termsCheck').checked;
    if (!termsChecked) {
      alert('약관에 동의해야 회원가입이 가능합니다.');
    return;
  }

    const formData = {
      login_id: document.getElementById('login_id').value,
      display_name: document.getElementById('display_name').value,
      phone_number: phoneInput.value,
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
