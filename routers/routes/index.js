const app = require('express').Router();
const db = require('../db');

app.use(/^(?!\/admin-page|\/logout|\/login|\/change-config)/, function(req, resp, next) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }
        
        let config = await client.query('SELECT * FROM config ORDER BY config_id')
        .then((result) => {
            done();
            if (result !== undefined) {
                return result.rows;
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        })

        if (config[1].status === 'Closed') {
            resp.render('closed', {status: 'Closed', message: 'The site is down for maintenance. Please check back later.', title: 'Closed'});
        } else {
            next();
        }
    });
});

app.get('/about', (req, resp) => {
    resp.render('blocks/about');
});

app.get('/tos', (req, resp) => {
    resp.render('blocks/tos');
});

app.get('/privacy', (req, resp) => {
    resp.render('blocks/privacy');
});

app.get('/search', (req, resp) => {
    resp.render('blocks/search');
});

app.get('/contact', (req, resp) => {
    resp.render('blocks/contact');
});

app.get('/logout', function(req, resp) {
    req.session = null;

    resp.redirect(req.get('referer'));
});

module.exports = app;