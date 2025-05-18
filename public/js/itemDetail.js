document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  if (!itemId) {
    alert('경매 ID가 없습니다.');
    return;
  }

  fetch(`/item/itemDetail/data?id=${itemId}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert('경매글을 불러오지 못했습니다.');
        return;
      }

      // 화면에 정보 표시
      document.querySelector('#title').textContent = data.title;
      document.querySelector('#description').textContent = data.content;
      document.querySelector('#current_price').textContent = data.current_price + '원';
      document.querySelector('#bid_unit').textContent = data.bid_unit + '원';
      document.querySelector('#end_time').textContent = data.end_time;
      document.querySelector('#status').textContent = data.status;
    })
    .catch(err => {
      console.error('❌ 상세 조회 실패:', err);
      alert('경매글을 불러오지 못했습니다.');
    });

  // ✅ 입찰 버튼 클릭 처리
  const bidBtn = document.getElementById('bidButton');

  if (bidBtn) {
    bidBtn.addEventListener('click', () => {
      fetch('/item/itemDetail/bid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: itemId })
      })
        .then(res => {
          if (!res.ok) throw new Error('입찰 실패');
          return res.json();
        })
        .then(() => {
          alert('입찰 완료!');
          window.location.replace('/items/itemList?_=' + Date.now()); // ✅ 목록으로 이동
        })
        .catch(err => {
          alert('입찰 실패 또는 마감된 경매입니다.');
          console.error(err);
        });
    });
  }
});
