// modules
const express = require('express');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const session = require('cookie-session');
const db = require('./routers/db');
const $ = require('jquery');

// server configurations
const port = process.env.PORT;
const app = express();
const server = require('http').createServer(app);

// body parser initialization
app.use(bodyParser.urlencoded({
    extended: true
}));

// cookie-session configurations
app.use(session({
    secret: process.env.SESSION_SECRET,
    maxAge: 1.8e+6
}));

app.use(function (req, res, next) {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next();
});

// static routes
const staticRoutes = require('./routers/static');
app.use(staticRoutes);

// routers
const routers = require('./routers/routes');
app.use(routers);

// authentication
const auth = require('./routers/auth');
app.use(auth);

// get data
const getData = require('./routers/get-data');
app.use(getData);

// posts handler
const posts = require('./routers/posts');
app.use(posts);

// users profile
const users = require('./routers/users');
app.use(users);

// admin configurations
const adminPanel = require('./routers/admin');
app.use(adminPanel);

// forums
const forums = require('./routers/forums');
app.use(forums);

// message controller
const message = require('./routers/messages');
app.use(message);

// setting view engine to use pug
app.set('view engine', 'pug');
app.set('views', ['templates', 'templates/inc', 'templates/blocks']);

// global middleware
app.post('/change-status', function(req, resp) {
    console.log(req.body);
    if (req.session.user && req.session.user.privilege > 1) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let queryString;

            if (req.body.type === 'categories') {
                queryString = `UPDATE categories SET category_status = $1 WHERE category_id = $2`;
            } else if (req.body.type === 'topics') {
                queryString = `UPDATE topics SET topic_status = $1 WHERE topic_id = $2`;
            } else if (req.body.type === 'subtopics') {
                queryString = `UPDATE subtopics SET subtopic_status = $1 WHERE subtopic_id = $2`;
            } else if (req.body.type === 'posts') {
                queryString = `UPDATE posts SET post_status = $1 WHERE post_id = $2`;
            } else if (req.body.type === 'users') {
                queryString = `UPDATE users SET user_status = $1 WHERE user_id = $2`;
            }

            await client.query(queryString, [req.body.status, req.body.id])
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'not found'});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });
        });
    } else {
        resp.send({status: 'unauthorized'});
    }
});

app.post('/delete-all', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        if (req.body.type === 'categories') {
            if (req.session.user && req.session.user.privilege > 1) {
                let catIds = req.body.ids.join(',');

                await client.query(`DELETE FROM categories WHERE category_id IN (${catIds})`)
                .then((result) => {
                    done();
                    if (result !== undefined && result.rowCount > 0) {
                        resp.send({status: 'success'});
                    } else {
                        resp.send({status: 'failed'});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'error'});
                })
            }
        } else if (req.body.type === 'messages') {
            let messageIds;
            
            if (req.body.ids.length > 1) {
                messageIds = req.body.ids.join(',');
            } else if (req.body.ids.length === 1) {
                messageIds = req.body.ids[0];
            }

            let authorizedUser = true;

            if (req.body.ids.length > 0) {
                let recipients = await client.query(`SELECT recipient FROM messages WHERE message_id IN (${messageIds})`)
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

                        for (let i in req.body.ids) {
                            await client.query('INSERT INTO deleted_messages (msg_deleted_by, deleted_msg) VALUES ($1, $2)', [req.session.user.username, req.body.ids[i]]);
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
        }
    })
})

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
        return false;
    }

    console.log('Server running on port ' + port);
    console.log(process.env.NODE_ENV);
});


module.exports = app;