const pg = require('pg');

let db;

if (process.env.NODE_ENV == 'production') {
    db = new pg.Pool({
        host: process.env.DATABASE_URL
    });
} else if (process.env.NODE_DEV === 'development') {
    db = new pg.Pool({
        user: process.env.PGSQL_USER,
        host: process.env.DATABASE_URL,
        password:process.env.PGSQL_PASSWORD,
        database: process.env.PGSQL_DATABASE,
        max:process.env.PGSQL_MAX,
        port: process.env.DB_PORT
    });
}

module.exports = db;