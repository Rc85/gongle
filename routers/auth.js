const app = require('express').Router();
const bcrypt = require('bcrypt');
const regex = require('./utils/regex');
const db = require('./db');
const CryptoJS = require('crypto-js');
const moment = require('moment');
const fn = require('./utils/functions');
const fs = require('fs');

app.post('/check-exists', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        if (req.body.type === 'username') { 
            let user = await client.query('SELECT username FROM users WHERE username = $1', [req.body.string])
            .then((result) => {
                done();
                if (result !== undefined) {
                    if (result.rows.length === 1) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    fn.error(req, resp, 500);
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            if (user) {
                resp.send({status: 'exist'});
            } else {
                resp.send({status: 'not exist'});
            }
        } else if (req.body.type === 'email') {
            let email = await client.query('SELECT email FROM users WHERE email = $1', [req.body.string])
            .then((result) => {
                done();
                if (result !== undefined) {
                    if (result.rows.length === 1) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    fn.error(req, resp, 500);
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            if (email) {
                resp.send({status: 'exist'});
            } else {
                resp.send({status: 'not exist'});
            }
        }
    });
});

app.post('/registration', function(req, resp) {
    if (req.body.agreement) {
        if (req.body.password === req.body.confirm_password && req.body.email === req.body.confirm_email) {
            if (regex.username.test(req.body.username) && regex.email.test(req.body.email)) {
                db.connect(async function(err, client, done) {
                    if (err) { console.log(err); }

                    let hashPassword = await bcrypt.hash(req.body.password, 10)
                    .then((result) => { return result; })
                    .catch((err) => { console.log(err); });

                    let registerUser = await client.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING user_id, username', [req.body.username, hashPassword, req.body.email])
                    .then((result) => {
                        done();
                        if (result !== undefined && result.rowCount === 1) {
                            return result.rows;
                        } else {
                            fn.error(req, resp, 500);
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                        fn.error(req, resp, 500);
                    });

                    fs.mkdir('user_files/' + registerUser[0].user_id, (err) => {
                        if (err) { console.log(err); }

                        fs.copyFile('images/profile_default.png', 'user_files/' + registerUser[0].user_id + '/profile_pic/' + registerUser[0].username + '_profile_pic.png', function(err) {
                            if (err) { console.log(err); }

                            resp.render('blocks/custom-response', {status: 'Success', message: 'Registration successful.'});
                        });
                    });
                });
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
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let publicKey;
        // Select the user from database
        let loginUser = await client.query('SELECT * FROM users WHERE email = $1', [req.body.email])
        .then((result) => {
            if (result !== undefined && result.rows.length === 1) {
                /* Encrypts the username into a random string.
                This allows a more secure way of accessing sensitive information on the user's account */
                let encrypted = CryptoJS.AES.encrypt(result.rows[0].username, process.env.ENC_KEY);
                // Public key is stored in the session and sent to the client side
                publicKey = encodeURIComponent(encrypted.toString());
                return result.rows[0];
            } else {
                fn.error(req, resp, 404, 'That user does not exist');
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        });

        // Compare the password sent by unhashing with bcrypt and comparing it with the one in database
        let matched = await bcrypt.compare(req.body.password, loginUser.password)
        .then((result) => { return result })
        .catch((err) => {
            console.log(err);
            done();
        });

        if (matched) {
            /* Save the last login as previous login
            This will be used later for getting new posts and/or replies since last login */
            let previousLogin = loginUser.last_login;
            let date = new Date();

            let loggedInUser = await client.query('UPDATE users SET last_login = $1, previous_login = $3 WHERE user_id =$2 RETURNING *', [date, loginUser.user_id, previousLogin])
            .then(result => {
                if (result !== undefined) {
                    return result.rows[0];
                }
            })
            .catch(err => {
                console.log(err);
            });

            delete loggedInUser.password; // Make sure to delete the password before storing it in the session
            loggedInUser.last_login = moment.tz(loginUser.last_login, 'America/Vancouver').format('MM/DD/YY @ h:mm A z');
            loggedInUser.session_key = publicKey;

            req.session.user = loggedInUser;

            let referer = req.get('referer').split('/').pop();
            /* During a fail login or registration, the referer head is set to the POST URL, which users cannot get.
            So we redirect them back to the main page. Of course, there are other POST URL as well. */
            if (referer === 'login' || referer === 'registration') {
                resp.redirect('/');
            } else {
                resp.redirect(req.get('referer'));
            }
        } else {
            fn.error(req, resp, 401, 'Incorrect password');
        }
    });
});

module.exports = app;