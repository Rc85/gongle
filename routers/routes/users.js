const app = require('express').Router();
const db = require('../db');
const moment = require('moment-timezone');
const fn = require('../utils/functions');

app.get('/profile', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let username = req.query.u,
            violations = [];

        let userProfile = await client.query("SELECT COUNT(posts.*) AS posts_count, SUM(posts.post_downvote) AS downvotes, SUM(posts.post_upvote) AS upvotes, avatar_url, user_id, username, email, last_login, user_status, user_level, hide_email FROM users LEFT OUTER JOIN posts ON users.username = posts.post_user WHERE users.username = $1 AND users.user_id > 3 GROUP BY users.user_id", [username])
        .then((result) => {
            if (result !== undefined && result.rows.length === 1) {
                result.rows[0].last_login = moment.tz(result.rows[0].last_login, 'America/Vancouver').format('MM/DD/YY @ hh:mm:ss A z');
                
                return result.rows[0];
            } else {
                fn.error(req, resp, 401);
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        });

        if (req.session.user) {
            violations = await client.query('SELECT violations.*, users.username FROM violations LEFT JOIN users ON violations.v_issued_by = users.user_id WHERE v_user_id = $1 ORDER BY v_date DESC', [req.session.user.user_id])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].v_date = moment(result.rows[i].v_date).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);  
            });
        }

        resp.render('blocks/profile-stats', {user: req.session.user, viewing: userProfile, violations: violations, title: 'User - Profile'});
    });
});

app.get('/profile/posts', (req, resp) => {
    if (req.session.user) {
        db.connect(async (err, client, done) => {
            if (err) { console.log(err); }

            let page = req.query.page ? parseInt(req.query.page) : 1;
            let offset;

            if (page > 1) {
                offset = (page - 1) * 20;
            } else {
                offset = 0;
            }

            let posts = await client.query(`SELECT posts.*,
                (SELECT COUNT(post_id) AS count FROM posts
                WHERE belongs_to_post_id IS NULL
                AND post_user = $1
                AND post_status != 'Removed') AS count FROM posts
            WHERE belongs_to_post_id IS NULL
            AND post_user = $1
            AND post_status != 'Removed'
            OFFSET $2
            LIMIT 20`, [req.session.user.username, offset])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            resp.render('blocks/profile-posts', {user: req.session.user, viewing: req.session.user, posts: posts, title: 'User - Posts', page: page});
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/profile/replies', (req, resp) => {
    if (req.session.user) {
        db.connect(async (err, client, done) => {
            if (err) { console.log(err); }

            let page = req.query.page ? parseInt(req.query.page) : 1;
            let offset;

            if (page > 1) {
                offset = (page - 1) * 20;
            } else {
                offset = 0;
            }

            let replies = await client.query(`SELECT posts.*,
                (SELECT COUNT(post_id) AS count FROM posts
                WHERE belongs_to_post_id IS NOT NULL
                AND post_user = $1
                AND post_status != 'Removed') AS count FROM posts
            WHERE belongs_to_post_id IS NOT NULL
            AND post_user = $1
            AND post_status != 'Removed'
            OFFSET $2
            LIMIT 20`, [req.session.user.username, offset])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            resp.render('blocks/profile-replies', {user: req.session.user, viewing: req.session.user, replies: replies, title: 'User - Replies', page: page});
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/profile/followed', (req, resp) => {
    if (req.session.user) {
        db.connect(async (err, client, done) => {
            if (err) { console.log(err); }

            let page = req.query.page ? parseInt(req.query.page) : 1;
            let offset;
            
            if (page > 1) {
                offset = (page - 1) * 20;
            } else {
                offset = 0;
            }

            let posts = await client.query(`SELECT *,
                (SELECT COUNT(followed_id) AS count FROM followed_posts
                WHERE user_following = $1) AS count FROM followed_posts
            LEFT OUTER JOIN posts ON followed_posts.followed_post = posts.post_id
            LEFT OUTER JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
            WHERE user_following = $1
            GROUP BY posts.post_id, followed_posts.followed_post, followed_posts.user_following, subtopics.subtopic_title, followed_posts.followed_id, subtopics.subtopic_id
            ORDER BY followed_on DESC
            LIMIT 20
            OFFSET $2`, [req.session.user.username, offset])
            .then((result) => {
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            resp.render('blocks/profile-followed', {user: req.session.user, viewing: req.session.user, posts: posts, page: page, title: 'User - Followed Posts'});
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/profile/friends', (req, resp) => {
    if (req.session.user) {
        db.connect(async(err, client, done) => {
            if (err) { console.log(err); }

            let friends = await client.query(`SELECT friends.*, users.user_id, users.email, users.last_login, users.user_status, users.user_level, users.avatar_url, users.online_status FROM friends
            LEFT JOIN users ON users.username = friends.befriend_with
            WHERE friendly_user = $1`, [req.session.user.username])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                    }
                    
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err)
                done();
                fn.error(req, resp, 500);
            });

            resp.render('blocks/profile-friends', {user: req.session.user, viewing: req.session.user, friends: friends, title: 'User - Friends'});
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/user-settings', function(req, resp) {
    if (req.session.user) {
        let validatedKey = fn.validateKey(req);

        if (validatedKey === req.session.user.username) {
            resp.render('blocks/user-settings', {user: req.session.user, title: 'User Settings'});
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 403);
    }
});

module.exports = app;