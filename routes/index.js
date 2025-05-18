const express = require('express');
const path = require('path');
const router = express.Router();

// HTML 반환
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 로그인 페이지 이동
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// API 응답
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  /** 여기서 db에 접근해서 쿼리를 통해 데이터를 뽑아와야해 */
  /** 조건을 이메일로 잡아야한다. 왜냐하면  */

  



  if(user_id == ''){
    res.json({message:'회원가입하지않은 계정입니다. 회원가입 후 진행해주세요.'});
  }else{
    if(user_pw == password){
      res.json({message:'로그인에 성공하였습니다.'});
    }else{
      res.json({message:'비밀번호가 일치하지 않습니다. 다시 시도해 주세요.'});
    }
  }



  if (email === 'test@test.com' && password === '1234') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: '이메일과 비밀번호가 일치하지 않습니다.' });
  }
});



module.exports = router;
