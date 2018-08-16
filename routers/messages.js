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

app.post('/save-message', function(req, resp) {
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

app.post('/unsave-message', (req, resp) => {
    if (req.session.user) {
        db.connect(async(err, client, done) => {
            if (err) { console.log(err); }

            await client.query('DELETE FROM saved_messages WHERE saved_msg = $1 and msg_saved_by = $2', [req.body.message_id, req.session.user.username])
            .then(result => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'not found'});
                }
            })
            .catch(err => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });
        });
    } else {
        resp.send({status: 'unauthorized'});
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
    console.log(req.body)
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let messageOwner = await client.query('SELECT recipient, sender FROM messages WHERE message_id = $1 AND (recipient = $2 OR sender = $2)', [req.body.message_id, req.session.user.username])
            .then((result) => {
                console.log(result.rows);
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
                        resp.send({status: 'success', from: req.body.from_location, key: req.session.user.session_key});
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
    console.log(req.body);
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

/*             let ids = req.body.ids.map(function(i) {
                return parseInt(i);
            })

            console.log(ids); */
            
            if (req.body.ids.length > 0) {
                let messages = await client.query('SELECT recipient, sender FROM messages WHERE message_id = ANY($1)', [req.body.ids])
                .then((result) => {
                    if (result !== undefined) {
                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                for (let message of messages) {
                    if (message.recipient === req.session.user.username || message.sender === req.session.user.username) {
                        try {
                            await client.query('BEGIN');
                            await client.query(`DELETE FROM saved_messages WHERE saved_msg = ANY($1)`, [req.body.ids]);
        
                            for (let i in req.body.ids) {
                                await client.query('INSERT INTO deleted_messages (msg_deleted_by, deleted_msg) VALUES ($1, $2)', [req.session.user.username, req.body.ids[i]]);
                            }
        
                            await client.query('COMMIT');
        
                            resp.send({status: 'success'});
                        } catch (err) {
                            await client.query('ROLLBACK');
                            console.log(err);
                            resp.send({status: 'error'});
                        }

                        done();
                    } else {
                        done();
                        resp.send({status: 'unauthorized'});
                    }
                }
            } else {
                done();
                resp.send({status: 'nothing'});
            }
        });
    } else {
        resp.send({status: 'unauthorized'});
    }
});

app.post('/report-message', (req, resp) => {
    if (req.session.user) {
        db.connect(async(err, client, done) => {
            if (err) { console.log(err); }

            await client.query('INSERT INTO user_reports (reported_primary_id, reported_by, reported_type, reported_content) VALUES ($1, $2, $3, $4)', [req.body.id, req.session.user.username, req.body.type, req.body.content])
            .then(result => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'fail'});
                }
            })
            .catch(err => {
                console.log(err);
                done();
                if (err.code = '23505') {
                    resp.send({status: 'duplicate'});
                } else {
                    resp.send({status: 'error'});
                }
            });
        });
    } else {
        resp.send({status: 'unauthorized'});
    }
});

module.exports = app;