const app = require('express').Router();
const db = require('./db');
const moment = require('moment');
const fn = require('./utils/functions');

app.post('/post', function(req, resp) {
    if (req.session.user) {
        db.query('SELECT user_status FROM users WHERE user_id = $1', [req.session.user.user_id], function(err, result) {
            if (err) {
                console.log(err);
                fn.error(req, resp, 500);
            } else if (result !== undefined && result.rows.length === 1) {
                if (result.rows[0].user_status === 'Active') {
                    db.query('SELECT post_reply($1, $2, $3, $4, $5, $6);', [req.body.title, req.session.user.username, req.body.subtopic_id, req.body.post_body, req.body.reply_to_post_id, req.body.belongs_to_post_id], function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send({status: 'fail'});
                        } else if (result !== undefined && result.rowCount === 1) {
                            let link = req.headers.referer;
            
                            resp.render('blocks/response', {user: req.session.user, status: 'Success', message: 'Post successfully created.', from: link})
                        }
                    });
                } else {
                    if (result.rows[0].user_status === 'Suspended') {
                        var message = 'You\'re temporary banned.';
                    } else if (result.rows[0].user_status === 'Banned') {
                        var message = 'You\'re permanently banned.';
                    }
                    fn.error(req, resp, 401, message);
                }
            } else {
                fn.error(req, resp, 404, 'User not found.');
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/edit-post', function(req, resp) {
    if (req.session.user) {
        let now = new Date();

        db.query('UPDATE posts SET post_title = $1, post_body = $2, post_modified = $3 WHERE post_id = $4 RETURNING post_id, post_topic', [req.body.title, req.body.post_body, now, req.body.post_id], function(err, result) {
            if (err) {
                console.log(err);
                fn.error(req, resp, 500);
            } else if (result !== undefined && result.rowCount === 1) {
                let link = req.headers.referer;

                resp.render('blocks/response', {user: req.session.user, status: 'Success', message: 'Your successfully edited your post.', from: link});
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

/* app.post('/vote-post', function(req, resp) {
    if (req.session.user) {
        console.log(req.body);
        if (req.body.vote === 'up') {
            //checkQuery = "SELECT downvoted_posts FROM users WHERE user_id = $1 AND downvoted_posts @> '{$2}'::int[]";
            updatePostQuery = 'UPDATE posts SET post_upvote = post_upvote + 1, post_downvote = post_downvote - 1 WHERE post_id = $1 RETURNING post_id, post_upvote, post_downvote';
            updateUserQuery = "UPDATE users SET user_upvoted_posts = user_upvoted_posts || $1, user_downvoted_posts = f_array_remove(user_downvoted_posts::int[], $1::int) WHERE user_id = $2 RETURNING user_downvoted_posts, user_upvoted_posts";
        } else if (req.body.vote === 'down') {
            //checkQuery = "SELECT upvoted_posts FROM users WHERE user_id = $1 AND downvoted_posts @> '{$2}'::int[]";
            updatePostQuery = 'UPDATE posts SET post_downvote = post_downvote + 1, post_upvote = post_upvote - 1 WHERE post_id = $1 RETURNING post_id, post_upvote, post_downvote';
            updateUserQuery = "UPDATE users SET user_downvoted_posts = user_downvoted_posts || $1, user_upvoted_posts = f_array_remove(user_upvoted_posts::int[], $1::int) WHERE user_id = $2 RETURNING user_downvoted_posts, user_upvoted_posts";
        }
            
        db.query(updateUserQuery, [req.body.id, req.session.user.user_id], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined) {
                if (result.rowCount === 1) {
                    let userResults = result.rows[0];

                    db.query(updatePostQuery, [req.body.id], function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send({status: 'error'});
                        } else if (result !== undefined) {
                            if (result.rowCount === 1) {
                                req.session.user.user_upvoted_posts = userResults.user_upvoted_posts;
                                req.session.user.user_downvoted_posts = userResults.user_downvoted_posts;

                                resp.send({status: 'success', vote_posts: result.rows[0]});
                            } else {
                                resp.send({status: 'fail'});
                            }
                        }
                    });
                } else {
                    resp.send({status: 'fail'});
                }
            }
        });
    }
}); */

app.post('/vote-post', function(req, resp) {
    function getTrackedVotes(vote_count, vote) {
        db.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1', [req.session.user.user_id], function(err, result) {
            if (err) { console.log(err); }

            if (result !== undefined) {
                let votes = result.rows;

                req.session.user.votes = result.rows;

                resp.send({status: 'success', vote_count: vote_count, vote: vote});
            }
        });
    }

    function updateVoteTracking(vote_count) {
        db.query('UPDATE vote_tracking SET vote = $1 WHERE voting_user_id = $2 AND voting_post_id = $3 RETURNING *', [req.body.vote, req.session.user.user_id, req.body.id], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined && result.rowCount === 1) {
                let vote = result.rows[0].vote;

                db.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1', [req.session.user.user_id], function(err, result) {
                    if (err) { console.log(err); }

                    if (result !== undefined) {
                        req.session.user.votes = result.rows;

                        resp.send({status: 'success', vote_count: vote_count, vote: vote});
                    }
                })
            }
        });
    }

    if (req.session.user) {
        db.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1 AND voting_post_id = $2', [req.session.user.user_id, req.body.id], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined) {
                if (result.rows.length === 1) {
                    if (req.body.vote === result.rows[0].vote) {
                        resp.send({status: 'voted'});
                    } else {
                        let voted = result.rows[0].vote;

                        if (voted === 'up') {
                            db.query('UPDATE posts SET post_upvote = post_upvote - 1, post_downvote = post_downvote - 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote', [req.body.id], function(err, result) {
                                if (err) { console.log(err); }

                                let vote_count = result.rows[0].post_upvote + result.rows[0].post_downvote;

                                updateVoteTracking(vote_count);
                            });
                        } else {
                            db.query('UPDATE posts SET post_downvote = post_downvote + 1, post_upvote = post_upvote + 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote', [req.body.id], function(err, result) {
                                if (err) { console.log(err); }

                                let vote_count = result.rows[0].post_upvote + result.rows[0].post_downvote;

                                updateVoteTracking(vote_count);
                            });
                        }
                    }
                } else {
                    db.query('INSERT INTO vote_tracking (voting_user_id, voting_post_id, vote) VALUES ($1, $2, $3) RETURNING vote', [req.session.user.user_id, req.body.id, req.body.vote], function(err, result) {
                        if (err) {
                            console.log(err);
                            resp.send({status: 'error'});
                        } else if (result !== undefined && result.rowCount === 1) {
                            let vote = result.rows[0].vote;

                            if (req.body.vote === 'up') {
                                db.query('UPDATE posts SET post_upvote = post_upvote + 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote', [req.body.id], function(err, result) {
                                    if (err) { console.log(err); }

                                    if (result !== undefined && result.rowCount === 1) {
                                        let vote_count = result.rows[0].post_upvote + result.rows[0].post_downvote;

                                        getTrackedVotes(vote_count, vote);
                                    }
                                });
                            } else {
                                db.query('UPDATE posts SET post_downvote = post_downvote - 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote', [req.body.id], function(err, result) {
                                    if (err) { console.log(err); }

                                    if (result !== undefined && result.rowCount === 1) {
                                        let vote_count = result.rows[0].post_upvote + result.rows[0].post_downvote;

                                        getTrackedVotes(vote_count, vote);
                                    }
                                });
                            }
                        }
                    });
                }
            } else {
                resp.send({status: 'error'});
            }
        });
    }
});

app.post('/get-post-freq', function(req, resp) {
    db.query("SELECT COUNT(*) FILTER (WHERE belongs_to_post_id IS NULL) AS posts, COUNT(*) FILTER (WHERE belongs_to_post_id IS NOT NULL) AS replies, date_trunc('day', post_created) AS date FROM posts WHERE post_user = $1 AND post_created BETWEEN $2 AND $3 GROUP BY date", [req.body.username, req.body.start_date, req.body.end_date], function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'error'});
        } else if (result !== undefined) {
            for (let i in result.rows) {
                result.rows[i].date = moment(result.rows[i].date).format('YYYY-MM-DD');
            }

            resp.send({status: 'success', data: result.rows});
        }
    });
});

app.post('/follow-post', function(req, resp) {
    if (req.session.user) {
        db.query('SELECT * FROM followed_posts WHERE followed_post = $1 AND user_following = $2', [req.body.post_id, req.session.user.username], function(err, result) {
            if (err) { console.log(err); }

            if (result !== undefined) {
                if (result.rows.length === 0) {
                    db.query('INSERT INTO followed_posts (followed_post, user_following) VALUES ($1, $2) RETURNING *', [req.body.post_id, req.session.user.username], function(err, result) {
                        if (err) {
                            console.log(err);
            
                            if (err.code = 23505) {
                                resp.send({status: 'followed'});
                            } else {
                                resp.send({status: 'error'});
                            }
                        } else if (result !== undefined && result.rowCount === 1) {
                            db.query('SELECT SUM(posts.post_upvote) AS upvotes, SUM(posts.post_downvote) AS downvotes, subtopic_title, post_topic, post_title, post_user, post_created, followed_id, followed_post, user_following FROM followed_posts LEFT OUTER JOIN posts ON followed_posts.followed_post = posts.post_id LEFT OUTER JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE user_following = $1 AND followed_id = $2 GROUP BY posts.post_topic, posts.post_title, posts.post_user, posts.post_created, followed_posts.followed_post, followed_posts.user_following, subtopics.subtopic_title, followed_posts.followed_id', [req.session.user.username, result.rows[0].followed_id], function(err, result) {
                                if (err) { console.log(err); }

                                if (result !== undefined) {
                                    result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
                                    req.session.user.followed_posts.push(result.rows[0]);
                                    resp.send({status: 'success'});
                                }
                            });
                        }
                    });
                } else {
                    db.query('DELETE FROM followed_posts WHERE followed_id = $1 RETURNING followed_id', [result.rows[0].followed_id], function(err, result) {
                        if (err) { console.log(err); }

                        if (result !== undefined && result.rowCount === 1) {
                            db.query('SELECT * FROM followed_posts WHERE user_following = $1', [req.session.user.username], function(err, result) {
                                if (err) { console.log(err); }

                                if (result !== undefined) {
                                    for (let i in result.rows) {
                                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                                    }
                                    req.session.user.followed_posts = result.rows;
                                    resp.send({status: 'unfollowed'});
                                }
                            });
                        }
                    });
                }
            }
        });
    }
});

module.exports = app;