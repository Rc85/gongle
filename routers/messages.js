const db = require('./db.js');
const app = require('express').Router();
const fn = require('./utils/functions');

app.post('/send-message', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            if (req.body.original_message) {
                var queryString = 'INSERT INTO messages (sender, recipient, subject, message, original_message) VALUES ($1, $2, $3, $4, $5)';
                var queryParams = [req.session.user.username, req.body.username, req.body.subject, req.body.message, req.body.original_message];
            } else {
                var queryString = 'INSERT INTO messages (sender, recipient, subject, message) VALUES ($1, $2, $3, $4)';
                var queryParams = [req.session.user.username, req.body.username, req.body.subject, req.body.message];
            }
    
            client.query(queryString, queryParams)
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/star-message', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            client.query('INSERT INTO saved_messages (msg_saved_by, saved_msg) VALUES ($1, $2)', [req.session.user.username, req.body.message_id])
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });
        });
    }
});

app.post('/change-message-status', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let authorizeUser = await client.query('SELECT recipient FROM messages WHERE message_id = $1', [req.body.message_id])
            .then((result) => {
                if (result !== undefined) {
                    return result.rows[0];
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.status({status: 'error'});
            });

            if (req.session.user.username === authorizeUser.recipient) {
                await client.query('UPDATE messages SET message_status = $1 WHERE message_id = $2', ['Read', req.body.message_id])
                .then(() => { done(); })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'error'});
                });

                resp.send({status: 'success'});
            } else {
                done();
                fn.error(req, resp, 403, 'You\'re not the owner of this message');
            }
        });
    } else {
        fn.error(req, resp, 403);
    }
});

app.post('/delete-message', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let messageOwner = await client.query('SELECT recipient FROM messages WHERE message_id = $1 AND recipient = $2', [req.body.message_id, req.session.user.username])
            .then((result) => {
                if (result !== undefined) {
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });

            if (messageOwner.length === 1) {
                await client.query('DELETE FROM saved_messages WHERE saved_msg = $1', [req.body.message_id]);

                await client.query('INSERT INTO deleted_messages (msg_deleted_by, deleted_msg) VALUES ($1, $2)', [req.session.user.username, req.body.message_id])
                .then((result) => {
                    done();
                    if (result !== undefined && result.rowCount === 1) {
                        resp.send({status: 'success', from: req.body.from, key: req.session.user.session_key});
                    } else {
                        resp.send({status: 'failed'});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'error'});
                });
            } else {
                done();
                resp.send({status: 'unauthorized'});
            }
        });
    } else {
        fn.error(req, resp, 403);
    }
});

app.post('/delete-all-messages', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let messageIds;
            
            if (req.body.messages.length > 1) {
                messageIds = req.body.messages.join(',');
            } else if (req.body.messages.length === 1) {
                messageIds = req.body.messages[0];
            }

            let authorizedUser = true;

            if (req.body.messages.length > 0) {
                let recipients = await client.query('SELECT recipient FROM messages WHERE message_id IN (' + messageIds + ')')
                .then((result) => {
                    if (result !== undefined) {
                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                for (let row of recipients) {
                    if (req.session.user.username !== row.recipient) {
                        authorizedUser = false;
                        break;
                    }
                }

                if (authorizedUser) {
                    try {
                        await client.query('BEGIN');
                        await client.query('DELETE FROM saved_messages WHERE saved_msg IN (' + messageIds + ')');

                        for (let i in req.body.messages) {
                            await client.query('INSERT INTO deleted_messages (msg_deleted_by, deleted_msg) VALUES ($1, $2)', [req.session.user.username, req.body.messages[i]]);
                        }

                        await client.query('COMMIT');
                        done();

                        resp.send({status: 'success'});
                    } catch (err) {
                        await client.query('ROLLBACK');
                        console.log(err);
                        done();
                        resp.send({status: 'error'});
                    }
                }
            } else {
                resp.send({status: 'nothing'});
            }
        });
    }
});

module.exports = app;