document.addEventListener('DOMContentLoaded', function () {
  const writeButton = document.getElementById('writeButton');
  if (writeButton) {
    writeButton.addEventListener('click', function () {
      location.href = '/items/itemWrite';
    });
  }

  fetch('/items/itemList/data?_=' + Date.now())
    .then(res => res.json())
    .then(items => {
      const listContainer = document.getElementById('item-list');
      listContainer.innerHTML = '';

      const timerElements = []; // 남은 시간 요소 모음

      items.forEach(item => {
        // 상태 뱃지
        const statusBadge = `<span class="badge ${item.badgeClass}">${item.status}</span>`;

        // 남은 시간 요소 (초록)
        const timeElem = document.createElement('p');
        timeElem.className = 'card-text text-success';
        timeElem.textContent = '남은 시간 계산 중...';

        // 카드 HTML (이미지 포함)
       const cardHTML = `
        <div class="card shadow h-100" style="height: 280px; overflow: hidden;">
          ${item.imageUrl
            ? `<img src="${item.imageUrl}" 
                    class="card-img-top"
                    alt="${item.title} 이미지"
                    style="height: 140px; width: 100%; object-fit: contain; background-color: white; border-top-left-radius: 8px; border-top-right-radius: 8px;">`
            : ''
          }
          <div class="card-body" style="padding: 10px; font-size: 0.85rem;">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="card-title">${item.title}</h5>
              ${statusBadge}
            </div>
            <p class="card-text">현재가: ${item.current}원</p>
            <p class="card-text">호가 단위: ${item.bidStep}원</p>
          </div>
        </div>
      `;


        // 카드 삽입
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = cardHTML;
        card.querySelector('.card-body').appendChild(timeElem);
        listContainer.appendChild(card);

        // 클릭 시 상세페이지
        card.querySelector('.card').addEventListener('click', () => {
          window.location.href = `/item/itemDetail?id=${item.id}`;
        });

        // 타이머용 저장
        timerElements.push({
          endTime: new Date(item.end_time),
          dom: timeElem
        });
      });

      // 공통 타이머
      setInterval(() => {
        const now = new Date();

        timerElements.forEach(({ endTime, dom }) => {
          let remaining = Math.floor((endTime - now) / 1000);
          if (remaining <= 0) {
            dom.textContent = '마감됨';
            dom.classList.remove('text-success');
            dom.classList.add('text-danger');
            return;
          }

          const hours = String(Math.floor(remaining / 3600)).padStart(2, '0');
          const minutes = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
          const seconds = String(remaining % 60).padStart(2, '0');
          dom.textContent = `남은 시간: ${hours}시 ${minutes}분 ${seconds}초`;
        });
      }, 1000);
    })
    .catch(err => {
      console.error('❌ 경매 목록 불러오기 실패:', err);
    });
});
