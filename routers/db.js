const pg = require('pg');
const url = require('url');

let db;

if (process.env.NODE_ENV == 'production') {
    db = new pg.Pool({
        //user: auth[0],
        //password: auth[1],
        connectionString: process.env.DATABASE_URL,
        //port: params.port,
        //database: params.pathname.split('/'[1]),
        max: 20,
        ssl: true
    });
} else if (process.env.NODE_ENV === 'development') {
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