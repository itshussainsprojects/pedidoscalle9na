// routes/menuRoutes.js
const express = require('express');
const router = express.Router();

// 👇 IMPORTACIÓN CORRECTA
const { getActiveMenu } = require('../models/menu');

// Pequeño log para verificar
console.log('DEBUG getActiveMenu type:', typeof getActiveMenu);

router.get('/menu', async (req, res, next) => {
  try {
    const menu = await getActiveMenu();
    res.json(menu);
  } catch (err) {
    console.error('Error en /api/menu:', err);
    next(err);
  }
});

module.exports = router;
