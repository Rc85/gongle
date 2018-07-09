const pg = require('pg');

pg.defaults.size = 20;

var pool = new pg.Pool({
    user: process.env.PGSQL_USER,
    host: process.env.DATABASE_URL,
    password:process.env.PGSQL_PASSWORD,
    database: process.env.PGSQL_DATABASE,
    max:process.env.PGSQL_MAX,
    port: process.env.DB_PORT
});

var db = {
    query: function() {
        var inputs = Array.from(arguments);

        var text = inputs.filter(function(type) {
            return typeof type == 'string';
        });

        var values = inputs.filter(function(type) {
            return typeof type == 'object';
        });

        var cb = inputs.filter(function(type) {
            return typeof type == 'function';
        });
        
        pool.connect(function(err, client, done) {
            if (err) { console.log(err); }

            client.query(text[0], values[0], function(err, result) {
                if (err) { console.log(err); }
                done();

                cb[0](err, result);
            });
        });
    }
}

module.exports = db;