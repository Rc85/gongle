const app = require('express').Router();
const db = require('./db');
const bcrypt = require('bcrypt');
const moment = require('moment');
const regex = require('./utils/regex');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const fn = require('./utils/functions');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        let dir = './user_files/' + req.session.user.user_id;
        let profileDir = dir + '/profile_pic';

        if (fs.existsSync(dir)) {
            cb(null, profileDir);
        } else {
            return cb(new Error('DIR_NOT_EXIST'));
        }
    },
    filename: function(req, file, cb) {
        let filename = req.session.user.username + '_profile_pic.png';
        cb(null, filename);
    }
});

var upload = multer({
    storage: storage,
    limits: {
        fileSize: 2000000
    },
    fileFilter: function(req, file, cb) {
        let extension = path.extname(file.originalname);

        if (regex.imgExt.test(extension)) {
            let filesize = parseInt(req.headers['content-length']);
            let dir = './user_files/' + req.session.user.user_id;
            let profileDir = dir + '/profile_pic';

            if (filesize < 2000000) {
                if (fs.existsSync(dir)) {
                    if (fs.existsSync(profileDir)) {
                        fs.readdir(profileDir, (err, files) => {
                            if (err) { console.log(err); }

                            for (let file of files) {
                                fs.unlinkSync(path.join(profileDir, file), err => {
                                    if (err) { console.log(err); }
                                });
                            }

                            cb(null, true);
                        });
                    } else {
                        fs.mkdir(profileDir, function(err) {
                            if (err) { console.log(err); }

                            cb(null, true);
                        });
                    }
                } else {
                    fs.mkdir(dir, function(err) {
                        if (err) { console.log(err); }

                        fs.mkdir(profileDir, function(err) {
                            if (err) { console.log(err); }


                            cb(null, true);
                        });
                    });
                }
            } else {
                let error = new Error('File too big');
                error.code = 'LIMIT_FILE_SIZE';
                return cb(error);
            }
        } else {
            let error = new Error('Invalid file type');
            error.code = 'INVALID_FILE_TYPE';
            return cb(error);
        }
    }
});

app.post('/change-settings', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            if (req.body.option === 'yes') {
                var option = true;
            } else if (req.body.option === 'no') {
                var option = false;
            }

            if (req.body.type === 'email') {
                var queryString = 'UPDATE users SET receive_email = $1 WHERE user_id = $2 RETURNING receive_email';
            } else if (req.body.type === 'show') {
                var queryString = 'UPDATE users SET show_online = $1 WHERE user_id = $2 RETURNING show_online';
            } else if (req.body.type === 'hide_email') {
                var queryString = 'UPDATE users SET hide_email = $1 WHERE user_id = $2 RETURNING hide_email';
            }

            await client.query(queryString, [option, req.session.user.user_id])
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    if (req.body.type === 'email') {
                        req.session.user.receive_email = result.rows[0].receive_email;
                    } else if (req.body.type === 'show') {
                        req.session.user.show_online = result.rows[0].show_online;
                    } else if (req.body.type === 'hide_email') {
                        req.session.user.hide_email = result.rows[0].hide_email;
                    }

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

app.post('/change-email', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let userExists = await client.query('SELECT email FROM users WHERE user_id = $1', [req.session.user.user_id])
            .then((result) => {
                if (result !== undefined && result.rows.length === 1) {
                    return true;
                } else {
                    return false;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });

            if (userExists) {
                if (regex.email.test(req.body.new) && regex.email.test(req.body.confirm)) {
                    if (userExists[0].email === req.body.current) {
                        if (req.body.new === req.body.confirm) {
                            let updateUser = await client.query('UPDATE users SET email = $1 WHERE user_id = $2 RETURNING email', [req.body.new, req.session.user.user_id])
                            .then((result) => {
                                done();
                                if (result !== undefined && result.rowCount === 1) {
                                    return result.rows;
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                                done();
                                fn.error(req, resp, 500);
                            });

                            req.session.user.email = updateUser[0].email;
                            let link = req.headers.referer;

                            resp.render('blocks/response', {user: req.session.user, status: 'Success', message: 'Email updated successfully.', from: link});
                        } else {
                            done();
                            fn.error(req, resp, 400, 'Your new passwords do not match.');
                        }
                    } else {
                        done();
                        fn.error(req, resp, 400, 'The password you entered is incorrect.');
                    }
                } else {
                    done();
                    fn.error(req, resp, 400, 'The format of your new email is invalid.');
                }
            } else {
                done();
                fn.error(req, resp, 404);
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/change-password', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let getPassword = await client.query('SELECT password FROM users WHERE user_id = $1', [req.session.user.user_id])
            .then((result) => {
                if (result !== undefined && result.rows.length === 1) {
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            })

            let authentication = await bcrypt.compare(req.body.current, getPassword[0].password)
            .then((result) => { return result; })
            .catch((err) => { console.log(err); });

            if (authentication) {
                if (req.body.new === req.body.confirm) {
                    let newPassword = await bcrypt.hash(req.body.new, 10)
                    .then((result) => { return result; })
                    .catch((err) => { console.log(err); });

                    
                    await client.query('UPDATE users SET password = $1 WHERE user_id = $2', [newPassword, req.session.user.user_id])
                    .then((result) => {
                        done();
                        if (result !== undefined && result.rowCount === 1) {
                            let link = req.headers.referer;

                            resp.render('blocks/response', {user: req.session.user, status: 'Success', message: 'Password updated successfully.', from: link});
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                        fn.error(req, resp, 500);
                    });
                } else {
                    done();
                    fn.error(req, resp, 400, 'The password you entered is incorrect.');
                }
            } else {
                done();
                fn.error(req, resp, 400, 'The password you entered is incorrect.');
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/upload-profile-pic', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let uploadProfilePic = upload.single('profile_pic');

            uploadProfilePic(req, resp, async function(err) {
                if (err) {
                    console.log(err);
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        fn.error(req, resp, 413, 'The filesize of the file you\'re trying to upload is too big.');
                    } else if (err.code === 'INVALID_FILE_TYPE') {
                        fn.error(req, resp, 406, 'The file you\'re trying to upload is not an acceptable image file.');
                    }
                }

                if (req.file !== undefined) {
                    if (req.file.mimetype === 'image/png' || req.file.mimetype === 'image/gif' || req.file.mimetype === 'image/jpeg' || req.file.mimetype === 'image/jpg') {
                        let avatarURL = '/files/' + req.session.user.user_id + '/profile_pic/' + req.file.filename;

                        await client.query('UPDATE users SET avatar_url = $1 WHERE user_id = $2 RETURNING avatar_url', [avatarURL, req.session.user.user_id])
                        .then((result) => {
                            done();
                            if (result !== undefined && result.rowCount === 1) {
                                req.session.user.avatar_url = result.rows[0].avatar_url;
                                resp.redirect(req.get('referer'));
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        })
                    } else {
                        done();
                        fn.error(req, resp, 406, 'The file you\'re trying to upload is not an acceptable image file.');
                    }
                } else {
                    done();
                    fn.error(req, resp, 500);
                }
            });
        });
    } else {
        fn.error(req, resp, 403);
    }
});

app.post('/user-report', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let queryString;
            let params;

            if (req.body.type === 'forum post') {
                queryString = `INSERT INTO user_reports (reported_primary_id, reported_type, reported_by) VALUES ($1, $2, $3)`;
                params = [req.body.post_id, req.body.type, req.session.user.username];
            } else if (req.body.type === 'forum reply') {
                queryString = `INSERT INTO user_reports (reported_primary_id, reported_alt_id, reported_type, reported_by) VALUES ($1, $2, $3, $4)`;
                params = [req.body.post_id, req.body.reply_id, req.body.type, req.session.user.username];
            }

            await client.query(queryString, params)
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'fail'});
                }
            })
            .catch((err) => {
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

app.post('/add-friend', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let addFriend = await client.query('INSERT INTO friends (friendly_user, befriend_with) VALUES ($1, $2) RETURNING fid, befriend_with', [req.session.user.username, req.body.username])
            .then((result) => {
                if (result !== undefined && result.rowCount === 1) {
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                if (err.code = '23505') {
                    resp.send({status: 'requested'});
                } else {
                    resp.send({status: 'error'});
                }
            });

            let message = `<p><i><b>*** This message is sent by the system on behalf of the requesting user. ***</i></b></p><p>If you would like to accept this friend request, click on the link below.</p><p><a id='accept-friend' href='/accept-friend-request?id=${addFriend[0].fid}'>Accept Friend Request</a></p>`;

            await client.query("INSERT INTO messages (sender, recipient, subject, message) VALUES ($1, $2, 'You have a friend request from " + req.session.user.username + "', $3)", [req.session.user.username, req.body.username, message])
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
        fn.error(req, resp, 403);
    }
});

app.post('/delete-friend', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            await client.query('DELETE FROM friends WHERE (friendly_user = $1 AND befriend_with = $2) OR (friendly_user = $2 AND befriend_with = $1) RETURNING befriend_with', [req.session.user.username, req.body.username])
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    let friendIndex = req.session.user.friends.indexOf(result.rows[0].befriend_with);

                    req.session.user.friends.splice(friendIndex, 1);
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
        fn.error(req, resp, 403);
    }
});

app.get('/accept-friend-request', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let authorizeUser = await client.query('SELECT * FROM friends WHERE fid = $1', [req.query.id])
            .then((result) => {
                if (result !== undefined && result.rows.length === 1) {
                    return result.rows;
                } else {
                    resp.send({status: 'not found'});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });

            if (req.session.user.username === authorizeUser[0].befriend_with) {
                let addFriend = await client.query('INSERT INTO friends (friendly_user, befriend_with, friend_confirmed, became_friend_on) VALUES ($1, $2, TRUE, current_timestamp) ON CONFLICT ON CONSTRAINT unique_pair DO UPDATE SET friend_confirmed = TRUE, became_friend_on = current_timestamp WHERE friends.friendly_user = $1 AND friends.befriend_with = $2 AND friends.friend_confirmed = FALSE', [req.session.user.username, authorizeUser[0].friendly_user])
                .then((result) => {
                    if (result !== undefined) {
                        return result;
                    } else {
                        resp.send({status: 'error'});
                    }
                 })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'add error'});
                });

                let acceptFriend = await client.query('UPDATE friends SET friend_confirmed = TRUE, became_friend_on = current_timestamp WHERE fid = $1 AND friend_confirmed = FALSE', [req.query.id])
                .then((result) => {
                    if (result !== undefined) {
                        return result;
                    } else {
                        resp.send({status: 'error'});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'accept error'});
                });

                if (addFriend.rowCount === 1 && acceptFriend.rowCount === 1) {
                    let message = '<p><b><i>*** This message is sent by the system on behalf of the approving user ***</b></i></p><p>' + req.session.user.username + ' has accepted your friend request and has been added to your friends list.</p>'

                    await client.query('INSERT INTO messages (sender, recipient, subject, message) VALUES ($1, $2, $3, $4)', [req.session.user.username, authorizeUser[0].friendly_user, 'Friend Request Accepted', message])

                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'are friends'});
                }

                done();
            } else {
                done();
                resp.send({status: 'invalid'});
            }
        });
    } else {
        fn.error(req, resp, 403);
    }
});

app.post('/unfriend', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let authorizeUser = await client.query('SELECT friendly_user, befriend_with FROM friends WHERE fid = $1', [req.body.fid])
            .then((result) => {
                if (result !== undefined && result.rows.length === 1) {
                    return result.rows;
                } else {
                    resp.send({status: 'not found'});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });

            if (req.session.user.username === authorizeUser[0].friendly_user) {
                let friendship = await client.query('SELECT fid FROM friends WHERE (friendly_user = $1 AND befriend_with = $2) OR (friendly_user = $2 AND befriend_with = $1)', [authorizeUser[0].friendly_user, authorizeUser[0].befriend_with])
                .then((result) => {
                    if (result !== undefined && result.rows.length > 0) {
                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                let friendsIdQuery;

                if (friendship.length > 1) {
                    let friendsId = [];
                    for (let friend of friendship) {
                        friendsId.push(friend.fid);
                    }

                    friendsIdQuery = 'DELETE FROM friends WHERE fid in (' + friendsId + ') RETURNING befriend_with';
                } else {
                    friendsIdQuery = 'DELETE FROM friends WHERE fid = ' + friendship[0].fid + ' RETURNING befriend_with';
                }

                console.log(friendsIdQuery)

                await client.query(friendsIdQuery)
                .then((result) => {
                    done();
                    if (result.rows.length > 1) {
                        for (let friend of result.rows) {
                            if (friend.befriend_with !== req.session.user.username) {
                                req.session.user.friends.splice(req.session.user.friends.indexOf(friend.befriend_with), 1);
                            }
                        }
                    } else {
                        req.session.user.friends.splice(req.session.user.friends.indexOf(friend.befriend_with), 1);
                    }
                    
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
                });
            } else {
                done();
                resp.send({status: 'invalid'});
            }
        });
    }
});

app.post('/change-notification-status', (req, resp) => {
    if (req.session.user) {
        db.connect(async(err, client, done) => {
            if (err) { console.log(err); }

            await client.query(`UPDATE notifications SET notification_status = 'Old' WHERE notification_owner = $1`, [req.session.user.username])
            .then(result => {
                if (result !== undefined) {
                    resp.send({status: 'success'});
                } else {
                    resp.send({status: 'fail'});
                }
            })
            .catch(err => {
                console.log(err);
                resp.send({status: 'error'});
            });

            done();
        });
    }
});

module.exports = app;