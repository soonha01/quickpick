async function loadUserInfo() {
  const res = await fetch('/session-user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });

  const data = await res.json();
  console.log(data); 
  if (data.user) {
    const { display_name, phone_number, profile_image } = data.user;
    
    // 보기 모드 표시
    document.getElementById('viewDisplayName').textContent = display_name;
    document.getElementById('viewPhoneNumber').textContent = phone_number;
    document.getElementById('viewProfileImage').src = profile_image || '/uploads/user_default.png';
    // 수정 모드 기본값 설정
    document.getElementById('display_name').value = display_name;
    document.getElementById('phone_number').value = phone_number;
    document.getElementById('profileImageView').src = profile_image || '/uploads/user_default.png';
  }
}

// 수정 버튼 클릭 시
document.getElementById('editButton').addEventListener('click', () => {
  document.getElementById('profileView').style.display = 'none';
  document.getElementById('profileEdit').style.display = 'block';
});

// 취소 버튼 클릭 시
document.getElementById('cancelEdit').addEventListener('click', () => {
  document.getElementById('profileEdit').style.display = 'none';
  document.getElementById('profileView').style.display = 'block';
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const display_name = document.getElementById('display_name').value;
  const phone_number = document.getElementById('phone_number').value;
  const profileImage = document.getElementById('profileImage').files[0];

  const formData = new FormData();
  formData.append('display_name', display_name);
  formData.append('phone_number', phone_number);
  if (profileImage) {
    formData.append('profileImage', profileImage);
  }

  try {
    // 1. 회원 정보 수정 + 이미지 업로드 요청
    const res = await fetch('/mypage/upload-profile-image', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert('회원 정보가 수정되었습니다.');

      window.location.reload();

      document.getElementById('viewDisplayName').textContent = display_name;
      document.getElementById('viewPhoneNumber').textContent = phone_number;
      

      // 닉네임 변경 반영
      const userNameElement = document.getElementById('userName');
      if (userNameElement) userNameElement.textContent = display_name;

      // 프로필 이미지 변경 반영
      if (data.imagePath) {
        const profileImg = document.getElementById('viewProfileImage');
        if (profileImg) {
          profileImg.src = data.imagePath;
        }
      }

      // 모드 전환
      document.getElementById('profileEdit').style.display = 'none';
      document.getElementById('profileView').style.display = 'block';
    } else {
      alert(data.message || '수정 실패');
    }
  } catch (err) {
    console.error('정보 수정 오류:', err);
    alert('서버 오류');
  }
  
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


// 페이지 로드 시 정보 불러오기
loadUserInfo();