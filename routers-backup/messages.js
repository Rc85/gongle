const db = require('./db.js');
const app = require('express').Router();

app.post('/send-message', function(req, resp) {
    if (req.session.user) {
        if (req.body.reply_to_message_id) {
            var queryString = 'INSERT INTO messages (sender, recipient, subject, message, reply_to_message) VALUES ($1, $2, $3, $4, $5)';
            var queryParams = [req.session.user.username, req.body.username, req.body.subject, req.body.message, req.body.reply_to_message_id];
        } else {
            var queryString = 'INSERT INTO messages (sender, recipient, subject, message) VALUES ($1, $2, $3, $4)';
            var queryParams = [req.session.user.username, req.body.username, req.body.subject, req.body.message];
        }

        db.query(queryString, queryParams, function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined && result.rowCount === 1) {
                resp.send({status: 'success'});
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/star-message', function(req, resp) {
    if (req.session.user) {
        db.query('INSERT INTO saved_messages (msg_saved_by, saved_msg) VALUES ($1, $2)', [req.session.user.username, req.body.message_id], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined && result.rowCount === 1) {
                resp.send({status: 'success'});
            }
        });
    }
});

module.exports = app;