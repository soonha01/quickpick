const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

// 최초 페이지
router.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/chat.html'));
});

module.exports = router;