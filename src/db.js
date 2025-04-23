import pg from 'pg';

// Configuración de la conexión
export const pool = new pg.Pool({
    user: 'postgres',        // Usuario de PostgreSQL
    host: 'localhost',         // Dirección del host (puede ser localhost o la IP de tu servidor)
    database: 'db_cmb', // Nombre de la base de datos
    password: '2409',   // Contraseña del usuario
    port: 5432,                // Puerto por defecto de PostgreSQL
});


