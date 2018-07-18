const pg = require('pg');
const url = require('url');

let db;

if (process.env.NODE_ENV == 'production') {
    let params = url.parse(process.env.DATABASE_URL);
    let auth = params.auth.split(':');

    db = new pg.Pool({
        user: auth[0],
        password: auth[1],
        host: params.hostname,
        port: params.port,
        database: params.pathname.split('/'[1]),
        max: 20,
        ssl: true
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