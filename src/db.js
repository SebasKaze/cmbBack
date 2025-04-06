import pg from 'pg';

export const pool = new pg.Pool({
    user: 'postgres', 
    host: 'localhost',
    database: 'db_cmb',
    password: 'admin2',
    port: 5432,
});
