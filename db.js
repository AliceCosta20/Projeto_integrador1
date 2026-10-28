const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
     host: process.env.DB_HOST || 'localhost', 
     user: process.env.DB_USER || 'root', 
     password: process.env.DB_PASSWORD || '',
     database: process.env.DB_NAME || 'Projeto_integrador', 
     connectionLimit: 5
});

module.exports = pool;