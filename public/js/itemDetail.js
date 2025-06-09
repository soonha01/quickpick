document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    alert('경매 ID가 없습니다.');
    return;
  }

  let writerKey = null;
  let loginUserKey = null;
  let endTime = null;

  fetch(`/item/itemDetail/data?id=${itemId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('경매글을 불러오지 못했습니다.');
        return;
      }

      writerKey = String(data.writerKey);
      loginUserKey = String(data.loginUserKey);
      endTime = new Date(data.end_time);

      document.querySelector('#title').textContent = data.title;
      document.querySelector('#description').textContent = data.content;
      document.querySelector('#current_price').textContent = Number(data.current_price).toLocaleString() + '원';
      document.querySelector('#bid_unit').textContent = Number(data.bid_unit).toLocaleString() + '원';
      document.querySelector('#status').textContent = data.status;


      //상태 뱃지(마감->빨간색  진행중->초록색)
      const statusElem = document.querySelector('#status');
      statusElem.textContent = data.status;

      if (data.status === '마감') {
        statusElem.classList.remove('badge-success');
        statusElem.classList.add('badge-danger');
      } else {
        statusElem.classList.remove('badge-danger');
        statusElem.classList.add('badge-success');
      }

      if (data.imageUrl) {
        document.querySelector('#itemImage').src = data.imageUrl;
        document.querySelector('#itemImage').style.display = 'block';
      } else {
        document.querySelector('#itemImage').style.display = 'none';
      }

      const timerElem = document.querySelector('#remaining_time');
      setInterval(() => {
        const now = new Date();
        let diff = Math.floor((endTime - now) / 1000);

        if (diff <= 0) {
          timerElem.textContent = '마감됨';
          timerElem.classList.remove('text-success');
          timerElem.classList.add('text-danger');
          return;
        }

        const hours = String(Math.floor(diff / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const seconds = String(diff % 60).padStart(2, '0');
        timerElem.textContent = `남은 시간: ${hours}시 ${minutes}분 ${seconds}초`;
        timerElem.classList.remove('text-danger');
        timerElem.classList.add('text-success');
      }, 1000);
    })
    .catch(err => {
      console.error('❌ 상세 조회 실패:', err);
      alert('경매글을 불러오지 못했습니다.');
    });

  // ✅ 입찰 버튼
  const bidBtn = document.getElementById('bidButton');

  if (bidBtn) {
    bidBtn.addEventListener('click', () => {
      if (writerKey === loginUserKey) {
        alert('자신이 등록한 경매에는 입찰할 수 없습니다.');
        return;
      }

      fetch('/item/itemDetail/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: itemId })
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || '입찰 실패');
          }
          return res.json();
        })
        .then(() => {
          alert('입찰 완료!');
          window.location.replace('/items/itemList?_=' + Date.now());
        })
        .catch(err => {
          alert(err.message);
          console.error('❌ 입찰 에러:', err);
        });
    });
  }
});
