# 🛍️ QuickPick - 실시간 경매 웹 애플리케이션

> 실시간으로 상품을 경매하고 낙찰받을 수 있는 웹 기반 경매 플랫폼입니다.  
> 실시간 입찰, 마감 처리, 채팅, 마이페이지 등 필수 경매 기능을 구현했습니다.

![quickpick](https://your-image-url.com)

---

## 📌 프로젝트 개요

**QuickPick**은 유저가 실시간으로 상품을 경매에 등록하고, 제한 시간 내 입찰을 통해 낙찰받을 수 있는 웹 애플리케이션입니다.  
프론트와 백엔드를 직접 구성하고, PostgreSQL과 연동하여 실시간 경매 처리를 구현했습니다.

---

## 🖥️ 개발 환경

| 구분       | 기술 스택 |
|------------|-----------|
| **Frontend** | HTML, CSS, Bootstrap, JavaScript |
| **Backend**  | Node.js (Express) |
| **DB**       | PostgreSQL |
| **Template** | EJS (채팅 페이지) |
| **ORM**      | pg 모듈 |
| **실행 환경** | VS Code, Node, Git, pgAdmin |
| **버전관리** | Git, GitHub |
| **기타**     | dotenv, nodemon, fetch API 등 |

---

## 🗂️ 주요 기능

### 🎯 경매 기능
- 경매 상품 등록 / 상세 페이지
- 입찰 등록 / 입찰 히스토리 확인
- 마감 시간 자동 처리 (setInterval)
- 마감 시 낙찰자 확정 및 상태 변경

### 🛠 관리자 및 백오피스
- 마감된 상품 DB 처리
- PostgreSQL DB 연결 (`pg` 사용)
- 서버 콘솔에서 실시간 로그 확인

### 💬 실시간 채팅 (EJS)
- 로그인된 사용자 간의 실시간 채팅 기능
- Socket.IO 또는 기본 fetch 사용 가능 (구현 방식에 따라)

### 👤 마이페이지
- 내가 등록한 상품 조회
- 내가 입찰한 경매 내역 확인

---

## 🔄 경매 처리 흐름

1. 유저가 경매 상품 등록
2. 클라이언트에서 6초 간격으로 마감 체크 요청 (`/auction/process-expired-auctions`)
3. 서버에서 마감 조건을 만족하는 상품 처리
4. 낙찰자 확정 → DB 업데이트
5. 프론트에서는 상태에 따라 뱃지 색상 (`badge-success`, `badge-danger` 등) 출력

---