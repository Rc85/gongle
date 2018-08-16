const app = require('express').Router();
const db = require('./db');
const moment = require('moment');
const fn = require('./utils/functions');

app.post('/post', function(req, resp) {
    if (req.session.user) {
        /* By default, Quill Editor will insert the <p> tag
        Here, we make sure that there is no infinite white space or <br> tags nested inside */
        let checkPost = /^(<p>|<p>(<br(\s|\/)*>|\s)*<\/p>)*$/;

        if (checkPost.test(req.body.post_body)) {
            resp.send({status: 'invalid post'});
        } else {
            db.connect(async(err, client, done) => {
                if (err) { console.log(err); }

                // Let's first make sure the user is not banned or has not activated the account
                let userStatus = await client.query('SELECT user_status FROM users WHERE user_id = $1', [req.session.user.user_id])
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

                let queryString;
                let params;

                if (req.body.belongs_to_post_id) { // If the post belongs to a parent post
                    // Get all status related to post
                    queryString = `SELECT category_status, topic_status, subtopic_status, post_status FROM posts
                    LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                    LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                    LEFT JOIN categories ON topics.topic_category = categories.category_id
                    WHERE posts.post_id = $1`;
                    params = [req.body.belongs_to_post_id];
                } else {
                    // Else get all status related to subtopic
                    queryString = `SELECT category_status, topic_status, subtopic_status, post_status FROM subtopics
                    LEFT JOIN posts ON posts.post_topic = subtopics.subtopic_id
                    LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                    LEFT JOIN categories ON topics.topic_category = categories.category_id
                    WHERE subtopics.subtopic_id = $1`;
                    params = [req.body.subtopic_id];
                }

                let status = await client.query(queryString, params) // Execute the query
                .then((result) => {
                    if (result !== undefined && result.rows.length > 0) {
                        return result.rows[0];
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'error'});
                });

                let allowPost;

                if (status !== undefined) { // Make sure the status is not undefined
                    if (status.category_status === 'Open') { // If category is open
                        allowPost = true; // Allow posting

                        if (status.topic_status !== 'Open') { // If category is open but topic is not open
                            allowPost = false; // Disallow posting
                        } else if (status.subtopic_status !== 'Open') { // If category and topic is open but subtopic is not open
                            allowPost = false;
                        } else if (status.post_status !== 'Open' && status.post_status !== null) { // If category, topic, and subtopic is open, but post is not
                            allowPost = false;
                        }
                    } else { // If category is closed
                        allowPost = false; 
                    }
                } else { // If status is undefined (rarely the case), we still handle it but not allow posting
                    allowPost = false;
                }

                if (allowPost) { // After the check, if allow is true
                    if (userStatus[0].user_status === 'Suspended') { // If user is banned
                        done();
                        resp.send({status: 'banned'});
                    } else if (userStatus[0].user_status === 'Banned') {
                        done();
                        resp.send({status: 'banned'});
                    } else if (userStatus.length === 0) { // If there is no such user (if somehow a user logs in with a fake account)
                        done();
                        resp.send({status: 'user not found'});
                    } else {
                        /* Execute a SQL function
                        This function simply inserts the post into the posts table and also increments the posts table's replies column with the total number of replies only if the post is a reply */
                        let id = await client.query('SELECT post_reply($1, $2, $3, $4, $5, $6, $7)', [req.body.title, req.session.user.username, req.body.subtopic_id, req.body.post_body, req.body.reply_to_post_id, req.body.belongs_to_post_id, req.body.tag])
                        .then((result) => {
                            console.log(result);
                            return result.rows[0].post_reply;
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                            resp.send({status: 'error'});
                        });

                        let user = await client.query(`SELECT post_user FROM posts WHERE post_id = $1`, [id[1]])
                        .then(result => {
                            if (result !== undefined && result.rows.length === 1) {
                                return result.rows[0].post_user;
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            done();
                        });

                        let notification = `A user replied to your <a href='/forums/posts/post-details?pid=${id[2]}&rid=${id[0]}'>post</a>.`;

                        await client.query(`INSERT INTO notifications (notification_title, notification_owner) VALUES ($1, $2)`, [notification, user])
                        .catch(err => { console.log(err); });

                        done();
                        resp.send({status: 'success'});
                    }
                } else {
                    resp.send({status: 'fail'})
                }    
            });
        }
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/edit-post', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let now = new Date();

            await client.query('UPDATE posts SET post_title = $1, post_body = $2, post_modified = $3 WHERE post_id = $4 RETURNING post_id, post_topic, belongs_to_post_id', [req.body.title, req.body.post_body, now, req.body.post_id])
            .then((result) => {
                done();
                if (result !== undefined && result.rowCount === 1) {
                    let link;

                    if (result.rows[0].belongs_to_post_id !== null) {
                        link = `/forums/posts/post-details?pid=${result.rows[0].belongs_to_post_id}`
                    } else {
                        link = `/forums/posts/post-details?pid=${result.rows[0].post_id}&page=1`
                    }

                    resp.send({status: 'success', link: link})
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            })
        });
    } else {
        resp.send({status: 'unauthorized'});
    }
});

app.post('/vote-post', function(req, resp) {
    /**  Get all the votes in the table and update the user's session
     * @param vote_count The sum of post_upvote and post_downvote
     * @param vote The value 'up' or 'down'
     */
    function getTrackedVotes(vote_count, vote) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            await client.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1', [req.session.user.user_id])
            .then((result) => {
                done();
                if (result !== undefined) {    
                    req.session.user.votes = result.rows;
    
                    resp.send({status: 'success', vote_count: vote_count, vote: vote});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });
    }

    /** Update vote_tracking table. Should only use a record already exists.
     * @param vote_count The sum of post_upvote and post_downvote
     */
    function updateVoteTracking(vote_count) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let vote = await client.query('UPDATE vote_tracking SET vote = $1 WHERE voting_user_id = $2 AND voting_post_id = $3 RETURNING *', [req.body.vote, req.session.user.user_id, req.body.id])
            .then((result) => {
                if (result !== undefined && result.rowCount === 1) {
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                resp.send({status: 'error'});
            });

            let trackedVotes = await client.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1', [req.session.user.user_id])
            .then((result) => {
                done();
                if (result !== undefined) {
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });

            req.session.user.votes = trackedVotes;

            resp.send({status: 'success', vote_count: vote_count, vote: vote[0].vote});
        });
    }

    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            // Check table for user ID and post ID
            let voted = await client.query('SELECT * FROM vote_tracking WHERE voting_user_id = $1 AND voting_post_id = $2', [req.session.user.user_id, req.body.id])
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

            if (voted.length === 1) {
                // If vote exists and if vote (up or down) sent from client matches one in database, respond with 'voted'
                if (req.body.vote === voted[0].vote) {
                    done();
                    resp.send({status: 'voted'});
                } else {
                    // If vote sent is 'down' and vote stored in database is 'up', deduct 1 from upvote and deduct 1 from downvote
                    // post_upvote and post_downvote starts at 0
                    // post_downvote will always be a negative value
                    let queryString;

                    if (voted[0].vote === 'up') {
                        queryString = 'UPDATE posts SET post_upvote = post_upvote - 1, post_downvote = post_downvote - 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote';
                    } else {
                        // If vote sent is up, then just increment both columns
                        queryString = 'UPDATE posts SET post_downvote = post_downvote + 1, post_upvote = post_upvote + 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote';
                    }

                    let voteCount = await client.query(queryString, [req.body.id])
                    .then((result) => {
                        done();
                        if (result !== undefined && result.rowCount === 1) {
                            return result.rows[0].post_upvote + result.rows[0].post_downvote;
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });

                    updateVoteTracking(voteCount);
                }
            } else {
                let insertVote = await client.query('INSERT INTO vote_tracking (voting_user_id, voting_post_id, vote) VALUES ($1, $2, $3) RETURNING vote', [req.session.user.user_id, req.body.id, req.body.vote])
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

                let queryString;

                if (insertVote[0].vote === 'up') {
                    queryString = 'UPDATE posts SET post_upvote = post_upvote + 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote';
                } else {
                    queryString = 'UPDATE posts SET post_downvote = post_downvote - 1 WHERE post_id = $1 RETURNING post_upvote, post_downvote';
                }

                let voteCount = await client.query(queryString, [req.body.id])
                .then((result) => {
                    done();
                    if (result !== undefined && result.rowCount === 1) {
                        return result.rows[0].post_upvote + result.rows[0].post_downvote;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                getTrackedVotes(voteCount, insertVote[0].vote);
            }
        });
    }
});

app.post('/follow-post', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let followedPost = await client.query('SELECT * FROM followed_posts WHERE followed_post = $1 AND user_following = $2', [req.body.post_id, req.session.user.username])
            .then((result) => {
                if (result !== undefined) {
                    return result.rows;
                }
            })
            .catch((err) => { console.log(err); });

            if (followedPost.length === 0) {
                let insertFollowedPost = await client.query('INSERT INTO followed_posts (followed_post, user_following) VALUES ($1, $2) RETURNING *', [req.body.post_id, req.session.user.username])
                .then((result) => {
                    if (result !== undefined && result.rowCount === 1) {
                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
    
                    if (err.code = 23505) {
                        resp.send({status: 'followed'});
                    } else {
                        resp.send({status: 'error'});
                    }
                });

                await client.query('SELECT SUM(posts.post_upvote) AS upvotes, SUM(posts.post_downvote) AS downvotes, subtopic_title, post_topic, post_title, post_user, post_created, followed_id, followed_post, user_following FROM followed_posts LEFT OUTER JOIN posts ON followed_posts.followed_post = posts.post_id LEFT OUTER JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE user_following = $1 AND followed_id = $2 GROUP BY posts.post_topic, posts.post_title, posts.post_user, posts.post_created, followed_posts.followed_post, followed_posts.user_following, subtopics.subtopic_title, followed_posts.followed_id', [req.session.user.username, insertFollowedPost[0].followed_id])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
                        req.session.user.followed_posts.push(result.rows[0]);
                        resp.send({status: 'success'});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });
            } else {
                await client.query('DELETE FROM followed_posts WHERE followed_id = $1', [followedPost[0].followed_id])
                .then((result) => {
                    if (result !== undefined && result.rowCount === 1) {
                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                await client.query('SELECT * FROM followed_posts WHERE user_following = $1', [req.session.user.username])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        }
                        req.session.user.followed_posts = result.rows;
                        resp.send({status: 'unfollowed'});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });
            }
        });
    }
});

module.exports = app;