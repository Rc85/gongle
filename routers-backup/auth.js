const app = require('express').Router();
const bcrypt = require('bcrypt');
const regex = require('./utils/regex');
const db = require('./db');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const fn = require('./utils/functions');
const fs = require('fs');

app.post('/check-exists', function(req, resp) {
    if (req.body.type === 'username') {
        db.query('SELECT username FROM users WHERE username = $1', [req.body.string], function(err, result) {
            if (err) { console.log(err); }

            if (result !== undefined && result.rows.length === 1) {
                resp.send({status: 'exist'});
            } else {
                resp.send({status: 'not exist'});
            }
        });
    } else if (req.body.type === 'email') {
        db.query('SELECT email FROM users WHERE email = $1', [req.body.string], function(err, result) {
            if (err) { console.log(err); }

            if (result !== undefined && result.rows.length === 1) {
                resp.send({status: 'exist'});
            } else {
                resp.send({status: 'not exist'});
            }
        });
    }
});

app.post('/registration', function(req, resp) {
    if (req.body.agreement) {
        if (req.body.password === req.body.confirm_password && req.body.email === req.body.confirm_email) {
            if (regex.username.test(req.body.username) && regex.email.test(req.body.email)) {
                bcrypt.hash(req.body.password, 10, function(err, result) {
                    if (err) { console.log(err); }
    
                    db.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING user_id, username', [req.body.username, result, req.body.email], function(err, result) {
                        if (err) {
                            console.log(err);
                            fn.error(req, resp, 500);
                        } else if (result !== undefined && result.rowCount === 1) {
                            db.query('UPDATE users SET avatar_URL = $1 WHERE user_id = $2 RETURNING user_id, username', ['/files/' + result.rows[0].user_id + '/profile_pic/' + result.rows[0].username + '_profile_pic.png', result.rows[0].user_id], function(err, result) {
                                if (err) {
                                    console.log(err);
                                    fn.error(req, resp, 500);
                                } else if (result !== undefined && result.rowCount === 1) {
                                    fs.mkdir('user_files/' + result.rows[0].user_id, function(err) {
                                        if (err) { console.log(err); }
                                        fs.mkdir('user_files/' + result.rows[0].user_id + '/profile_pic', function(err) {
                                            if (err) { console.log(err); }
        
                                            fs.copyFile('images/profile_default.png', 'user_files/' + result.rows[0].user_id + '/profile_pic/' + result.rows[0].username + '_profile_pic.png', function(err) {
                                                if (err) { console.log(err); }
            
                                                resp.render('blocks/custom-response', {status: 'Success', message: 'Registration successful.'});
                                            });
                                        });
                                    });
                                } else {
                                    fn.error(req, resp, 500);
                                }
                            });
                        } else {
                            fn.error(req, resp, 500);
                        }
                    })
                })
            } else {
               fn.error(req, resp, 400, 'One or more credentials contains invalid format.');
            }
        } else {
            fn.error(req, resp, 400, 'Your password or email do not match.');
        }
    } else {
        fn.error(req, resp, 400, 'You must read and accept the terms of service.');
    }
});

app.post('/login', (req, resp) => {
    db.query('SELECT * FROM users WHERE email = $1', [req.body.email], function(err, result) {
        if (err) { console.log(err); }

        if (result !== undefined && result.rows.length === 1) {
            let encrypted = CryptoJS.AES.encrypt(result.rows[0].username, process.env.ENC_KEY);
            let encoded = encodeURIComponent(encrypted.toString());

            bcrypt.compare(req.body.password, result.rows[0].password, function(err, matched) {
                if (err) { console.log(err); }
    
                if (matched) {
                    if (result.rows[0].user_status === 'Active') {
                        let now = new Date();
                        let user = result.rows[0];

                        db.query('UPDATE users SET last_login = $1 WHERE email = $2', [now, req.body.email], function(err, result) {
                            if (err) {
                                console.log(err);
                                fn.error(req, resp, 500);
                            } else if (result !== undefined && result.rowCount === 1) {
                                db.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1', [user.user_id], function(err, result) {
                                    if (err) { console.log(err); }
        
                                    if (result !== undefined) {
                                        let votes = result.rows;
        
                                        db.query('SELECT * FROM followed_posts WHERE user_following = $1', [user.username], function(err, result) {
                                            if (err) { console.log(err); }

                                            if (result !== undefined) {
                                                let followedPosts = result.rows

                                                db.query('SELECT befriend_with FROM friends WHERE friendly_user = $1', [user.username], function(err, result) {
                                                    if (err) { console.log(err); }

                                                    if (result !== undefined) {
                                                        let friends = []

                                                        for (let i in result.rows) {
                                                            friends.push(result.rows[i].befriend_with);
                                                        }

                                                        db.query('SELECT blocked_user FROM blocked_users WHERE blocking_user = $1', [user.username], function(err, result) {
                                                            if (err) { console.log(err); }
                                                            
                                                            if (result !== undefined) {
                                                                let blockedUsers = []
        
                                                                for (let i in result.row) {
                                                                    blockedUsers.push(result.rows[i].blocked_user);
                                                                }
                                                                    
                                                                delete user.password;
                                                                user.last_login = moment.tz(user.last_login, 'America/Vancouver').format('MM/DD/YY @ h:mm A z');
                                                                user.session_key = encoded;
                                                                user.followed_posts = followedPosts;
                                                                user.votes = votes;
                                                                user.friends = friends;
                                                                user.blocked_users = blockedUsers;
                                    
                                                                req.session.user = user;
                                                                console.log(req.session.user);
                            
                                                                let referer = req.get('referer').split('/').pop();
                                                                if (referer === 'login' || referer === 'registration') {
                                                                    resp.redirect('/');
                                                                } else {
                                                                    resp.redirect(req.get('referer'));
                                                                }
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                });
                            } else {
                                fn.error(req, resp, 404);
                            }
                        });
                    } else if (result.rows[0].user_status === 'Banned') {
                        fn.error(req, resp, 403, 'Your account is temporary banned.');
                    } else if (result.rows[0].user_status === 'Deleted') {
                        fn.error(req, resp, 403, 'Your account is permanently banned.');
                    } else {
                        fn.error(req, resp, 403, 'Your account is not activated.');
                    }
                } else {
                    fn.error(req, resp, 401, 'The email or password is incorrect.');
                }
            });
        } else {
            fn.error(req, resp, 401, 'The email or password is incorrect.');
        }
    });
});

app.post('/admin-login', function(req, resp) {
    db.query('SELECT * FROM users WHERE username = $1', [req.body.username], function(err, result) {
        if (err) { console.log(err); }

        if (result !== undefined && result.rows.length === 1) {
            if (result.rows[0].privilege > 1) {
                bcrypt.compare(req.body.password, result.rows[0].password, function(err, matched) {
                    if (err) { console.log(err); }
    
                    if (matched) {
                        delete result.rows[0].password;
                        req.session.user = result.rows[0];

                        resp.redirect('/admin-page/overview');
                    } else {
                        resp.render('admin-login', {message: 'Incorrect username or password', title: 'Admin Login'});
                    }
                });
            } else {
                resp.render('admin-login', {message: 'You\'re not authorized.', title: 'Admin Login'});
            }
        } else {
            resp.render('admin-login', {message: 'You\'re not authorized.', title: 'Admin Login'});
        }
    });
});

module.exports = app;