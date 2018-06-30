const pg = require('pg');

pg.defaults.size = 20;

if (process.env.NODE_ENV === 'production') {
    pg.defaults.size = 20;
    var db = new pg.Client(process.env.DATABASE_URL);
    db.connect();
} else {
    var db = new pg.Pool({
        user: process.env.PGSQL_USER,
        host: process.env.DATABASE_URL,
        password:process.env.PGSQL_PASSWORD,
        database: process.env.PGSQL_DATABASE,
        max:process.env.PGSQL_MAX,
        port: process.env.DB_PORT
    });
}

module.exports = db;