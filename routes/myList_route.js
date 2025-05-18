const express = require('express');
const path = require('path');
const router = express.Router();
const db = require('../db'); 

// 최초 페이지
router.get('/myList', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/myList.html'));
});

module.exports = router;