const app = require('express').Router();
const db = require('../db');
const fn = require('../utils/functions');

app.get('/register', function(req, resp) {
    if (req.session.user) {
        fn.error(req, resp, 400, 'You are logged in');
    } else {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }
            
            await client.query("SELECT * FROM config WHERE config_name = 'Registration'")
            .then((result) => {
                done();
                if (result !== undefined && result.rows[0].status === 'Open') {
                    resp.render('blocks/register', {title: 'Register'});
                } else {
                    fn.error(req, resp, 403, 'Registration is closed. Please check back later.');
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });
    }
});

module.exports = app;