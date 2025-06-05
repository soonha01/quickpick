const includes = [
  ['sidebar-container', '/partials/sidebar.html'],
  ['topbar-container', '/partials/topbar.html'],
  ['footer-container', '/partials/footer.html']
];

// include HTML 로딩이 완료될 때까지 기다리기
Promise.all(
  includes.map(([id, url]) =>
    fetch(url)
      .then(res => res.text())
      .then(html => {
        const target = document.getElementById(id);
        if (target) {
          target.innerHTML = html;
        } else {
          console.warn(`⚠️ ID "${id}"를 가진 요소가 HTML에 없음`);
        }
      })
  )
).then(() => {
  // 모든 includes 완료 후 로그인 상태 체크
  fetch('/session-user', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      const userNameElement = document.getElementById('userName');
      const profileImageElement = document.getElementById('topbarProfileImage');

      if (!userNameElement) {
        console.warn('❗ userName 요소를 찾지 못했습니다.');
        return;
      }

      if (data.user && data.user.display_name) {
        userNameElement.textContent = data.user.display_name;

        if (profileImageElement) {
          profileImageElement.src = data.user.profile_image || '/uploads/user_default.png';
        }
      } else {
        userNameElement.innerHTML = '<button type="button">로그인</button>';
      }
    })
    .catch(err => {
      console.error('에러 발생:', err);
    });
});