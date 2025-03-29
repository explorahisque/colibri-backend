// db.js
const { Pool } = require('pg');

// Configura los detalles de conexión
const pool = new Pool({
  user: 'exploracolibri',           // Usuario de PostgreSQL (por defecto es 'postgres')
  host: 'colibridb.postgres.database.azure.com',          // Host local
  database: 'educacionazure',      // Nombre de la base de datos creada
  password: 'fHijP7qFB99rr4V',   // Reemplaza con tu contraseña
  port: 5432,                 // Puerto por defecto
  ssl: {
    require: true, // Forzar SSL
    rejectUnauthorized: false // Opcional: dependiendo de la configuración del certificado en Azure
  }
});

// Evento para confirmar la conexión
pool.on('connect', () => {
  console.log('Conectado a la base de datos PostgreSQL');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
