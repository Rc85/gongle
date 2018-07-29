const app = require('express').Router();
const db = require('./db');
const moment = require('moment');
const fn = require('./utils/functions');

app.get('/get-categories', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query(`
        SELECT *
        FROM categories 
        ORDER BY category`)
        .then((result) => {
            done();
            if (result !== undefined) {
                resp.send({status: 'success', categories: result.rows});
            } else {
                resp.send({status: 'fail'});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });
    });
});

app.post('/get-category-count', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query(`
        SELECT COUNT(category_id) AS count
        FROM categories`)
        .then((result) => {
            done();
            if (result !== undefined) {
                let obj = {
                    page: req.body.page
                }

                resp.send({status: 'success', count: result.rows[0].count, obj: obj});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });
    });
});

app.post('/get-topics', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let queryString;

        if (req.body.category === undefined) {
            queryString = `SELECT *
            FROM topics
            ORDER BY topic_title`;
        } else {
            queryString = `SELECT *
            FROM topics
            WHERE topic_category = '${req.body.category}'
            ORDER BY topic_title`;
        }

        await client.query(queryString)
        .then((result) => {
            done();
            if (result !== undefined) {
                resp.send({status: 'success', topics: result.rows});
            } else {
                resp.send({status: 'fail'});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'fail'});
        });
    });
});

app.post('/get-subtopics-by-topics', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query('SELECT subtopic_id, subtopic_title FROM subtopics WHERE belongs_to_topic = $1 ORDER BY subtopic_title', [req.body.topic])
        .then((result) => {
            done();
            if (result !== undefined) {
                resp.send({status: 'success', subtopics: result.rows});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'fail'});
        });
    });
    /* db.query('SELECT subtopic_id, subtopic_title FROM subtopics WHERE belongs_to_topic = $1 ORDER BY subtopic_title', [req.body.topic], function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'fail'});
        } else if (result !== undefined) {
            resp.send({status: 'success', subtopics: result.rows});
        }
    }); */
});

app.post('/get-belongs-to', function(req, resp) {
    if (req.body.topic !== '') {
        var queryString = 'SELECT topic_id AS id, topic_title AS title FROM topics WHERE topic_category = $1 ORDER BY topic_title';
        var param = [req.body.category];
        var id = req.body.topic;
    } else {
        var queryString = 'SELECT category_id AS id, category AS title FROM categories WHERE category_id > $1 ORDER BY category';
        var param = ['0'];
        var id = req.body.category;
    }

    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query(queryString, param)
        .then((result) => {
            done();
            if (result !== undefined) {
                resp.send({status: 'success', topics: result.rows, id: id});
            } else {
                resp.send({status: 'fail'});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'fail'});
        });
    });

    /* db.query(queryString, param, function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'fail'});
        }
        if (result !== undefined) {
            resp.send({status: 'success', topics: result.rows, id: id});
        }
    }); */
});

app.post('/get-subtopic-details', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }
        let queryString;
        let params;
        if (req.body.topic !== '') {
            queryString = `SELECT subtopic_id AS id, subtopic_title AS title, subtopic_created_on AS created_on, belongs_to_topic AS belongs_to, subtopic_status AS status, subtopic_created_by AS created_by, topic_title AS parent_title, topic_id AS parent_id
            FROM subtopics
            JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
            WHERE subtopics.belongs_to_topic = $1
            ORDER BY subtopic_title`;
            params = [req.body.topic];
        } else {
            queryString = `SELECT topic_id AS id, topic_title AS title, topic_created_on AS created_on, topic_category AS belongs_to, topic_status AS status, topic_created_by AS created_by, category AS parent_title, category_id AS parent_id
            FROM topics
            JOIN categories ON topics.topic_category = categories.category_id
            WHERE topics.topic_category = $1
            ORDER BY topic_category, topic_title`;
            params = [req.body.category];
        }

        let subtopicDetails = await client.query(queryString, params)
        .then((result) => {
            if (result !== undefined && result.rows.length > 0) {
                return result.rows;
            } else {
                return [];
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        });

        if (subtopicDetails.length > 0) {
            let last = 0;
            let obj = {}

            for (let topic of subtopicDetails) {
                if (topic.belongs_to === last) {
                    obj[topic.belongs_to][topic.id] = topic.title;
                } else {
                    last = topic.belongs_to;
                    obj[topic.belongs_to] = {}
                    obj[topic.belongs_to][topic.id] = topic.title;
                }
            }

            for (let i in subtopicDetails) {
                subtopicDetails[i].created_on = moment(subtopicDetails[i].subtopic_created_on).format('MM/DD/YYYY @ hh:mm:ss A');
            }

            done();
            resp.send({status: 'success', subtopics: obj, results: subtopicDetails});
        } else {
            if (req.body.topic !== '') {
                queryString = 'SELECT topic_id AS parent_id, topic_title AS parent_title FROM topics WHERE topic_id = $1';
                params = [req.body.topic];
            } else {
                queryString = 'SELECT category_id AS parent_id, category AS parent_title FROM categories WHERE category_id = $1';
                params = [req.body.category];
            }

            await client.query(queryString, params)
            .then((result) => {
                done();
                if (result !== undefined) {
                    resp.send({status: 'success', subtopics: [], results: result.rows});
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        }
    });

    /* db.query(queryString, param, function(err, result) {
        if (err) { console.log(err); }

        if (result !== undefined && result.rows.length > 0) {
            console.log(result.rows);
            let last = 0;
            let obj = {}

            for (let topic of result.rows) {
                if (topic.belongs_to === last) {
                    obj[topic.belongs_to][topic.id] = topic.title;
                } else {
                    last = topic.belongs_to;
                    obj[topic.belongs_to] = {}
                    obj[topic.belongs_to][topic.id] = topic.title;
                }
            }

            for (let i in result.rows) {
                result.rows[i].created_on = moment(result.rows[i].subtopic_created_on).format('MM/DD/YYYY @ hh:mm:ss A');
            }

            resp.send({status: 'success', subtopics: obj, results: result.rows});
        } else {
            if (req.body.topic !== '') {
                var queryString = 'SELECT topic_id AS parent_id, topic_title AS parent_title FROM topics WHERE topic_id = $1';
                var param = [req.body.topic];
            } else {
                var queryString = 'SELECT category_id AS parent_id, category AS parent_title FROM categories WHERE category_id = $1';
                var param = [req.body.category];
            }

            db.query(queryString, param, function(err, result) {
                if (err) { console.log(err); }

                if (result !== undefined) {
                    console.log(result.rows);
                    resp.send({status: 'success', subtopics: [], results: result.rows});
                }
            });
        }
    }); */
});

app.post('/get-subtopics', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query('SELECT * FROM subtopics WHERE belongs_to_topic = $1 ORDER BY subtopic_title', [req.body.topic_id])
        .then((result) => {
            done();
            if (result !== undefined) {
                resp.send({status: 'success', subtopics: result.rows});
            } else {
                resp.send({status: 'error'});
            }
        })
        .catch((err) => {
            if (err) {
                console.log(err);
                done();
                resp.send({status: 'error'});
            }
        });
    });
    /* db.query('SELECT * FROM subtopics WHERE belongs_to_topic = $1', [req.body.topic_id], function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'error'});
        } else if (result !== undefined) {
            resp.send({status: 'success', subtopics: result.rows});
        }
    }); */
});

app.post('/get-posts', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        if (req.body.type === 'popular') {
            var queryString = 'SELECT post_id, post_title, post_topic, post_created, post_upvote, post_downvote FROM posts WHERE reply_to_post_id IS NULL ORDER BY post_upvote DESC LIMIT 10';
        } else if (req.body.type === 'new') {
            var queryString = 'SELECT post_id, post_title, post_topic, post_created, post_upvote, post_downvote, replies, post_user FROM posts WHERE reply_to_post_id IS NULL ORDER BY post_created DESC LIMIT 10';
        } else if (req.body.type === 'active') {
            var queryString = 'SELECT * FROM (SELECT COUNT(p1.post_id) AS count, p1.belongs_to_post_id, p2.post_title, p2.post_created, p2.post_upvote, p2.post_downvote FROM posts p1 LEFT JOIN posts p2 ON p1.belongs_to_post_id = p2.post_id WHERE p1.belongs_to_post_id IS NOT NULL AND p2.reply_to_post_id IS NULL GROUP BY p1.belongs_to_post_id, p2.post_title, p2.post_created, p2.post_upvote, p2.post_downvote ORDER BY count DESC) AS count_table WHERE count > 5;';
        } else if (req.body.type === 'all') {
            var queryString = 'SELECT * FROM posts';
        }
    
        await client.query(queryString)
        .then((result) => {
            done();
            if (result !== undefined) {
                for (let i in result.rows) {
                    result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                }
    
                resp.send({status: 'success', posts: result.rows});
            } else {
                resp.send({status: 'error'});
            }
        })
        .catch((err) => {
            if (err) {
                console.log(err);
                done();
                resp.send({status: 'error'});
            }
        });
    });
    /* if (req.body.type === 'popular') {
        var queryString = 'SELECT post_id, post_title, post_topic, post_created, post_upvote, post_downvote FROM posts WHERE reply_to_post_id IS NULL ORDER BY post_upvote DESC LIMIT 10';
    } else if (req.body.type === 'new') {
        var queryString = 'SELECT post_id, post_title, post_topic, post_created, post_upvote, post_downvote, replies, post_user FROM posts WHERE reply_to_post_id IS NULL ORDER BY post_created DESC LIMIT 10';
    } else if (req.body.type === 'active') {
        var queryString = 'SELECT * FROM (SELECT COUNT(p1.post_id) AS count, p1.belongs_to_post_id, p2.post_title, p2.post_created, p2.post_upvote, p2.post_downvote FROM posts p1 LEFT JOIN posts p2 ON p1.belongs_to_post_id = p2.post_id WHERE p1.belongs_to_post_id IS NOT NULL AND p2.reply_to_post_id IS NULL GROUP BY p1.belongs_to_post_id, p2.post_title, p2.post_created, p2.post_upvote, p2.post_downvote ORDER BY count DESC) AS count_table WHERE count > 5;';
    } else if (req.body.type === 'all') {
        var queryString = 'SELECT * FROM posts';
    }

    db.query(queryString, function(err, result) {
        if (err) {
            console.log(err);
            
            resp.send({success: false});
        }

        if (result !== undefined) {
            for (let i in result.rows) {
                result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
            }

            resp.send({status: 'success', posts: result.rows});
        }
    }); */
});

app.post('/get-replies', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query('SELECT SUM(count_replies) AS num_of_replies FROM (SELECT COUNT(reply_to_post_id) AS count_replies FROM posts WHERE belongs_to_post_id = $1 AND reply_to_post_id IS NOT NULL GROUP BY reply_to_post_id) AS p2', [req.body.post_id])
        .then((result) => {
            done();
            if (result !== undefined) {
                let page = parseInt(req.body.page);
                let obj = {page: page}
    
                resp.send({status: 'success', replies: result.rows[0].num_of_replies, obj: obj});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        });
    });
});

app.post('/get-user-posts', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let page = parseInt(req.body.page);

            if (page > 1) {
                var offset = (page - 1) * 10;
            } else {
                var offset = 0;
            }

            if (req.body.type === 'posts') {
                var queryString = "SELECT COUNT(post_id) AS total_posts, posts.*, subtopics.subtopic_title FROM posts JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE post_user = $1 AND reply_to_post_id IS NULL AND posts.post_status != 'Removed' GROUP BY posts.post_id, subtopics.subtopic_title ORDER BY post_created DESC LIMIT 10 OFFSET $2";
            } else if (req.body.type === 'replies') {
                var queryString = "SELECT COUNT(post_id) AS total_posts, posts.*, subtopics.subtopic_title FROM posts JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE post_user = $1 AND reply_to_post_id IS NOT NULL AND posts.post_status != 'Removed' GROUP BY posts.post_id, subtopics.subtopic_title ORDER BY post_created DESC LIMIT 10 OFFSET $2";
            } else if (req.body.type === 'followed') {
                var queryString = "SELECT COUNT(posts.post_id) AS total_posts, subtopic_title, posts.*, followed_id, followed_post, user_following FROM followed_posts LEFT OUTER JOIN posts ON followed_posts.followed_post = posts.post_id LEFT OUTER JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE user_following = $1 GROUP BY posts.post_id, followed_posts.followed_post, followed_posts.user_following, subtopics.subtopic_title, followed_posts.followed_id ORDER BY followed_on DESC LIMIT 10 OFFSET $2";
            }

            await client.query(queryString, [req.session.user.username, offset])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                    }

                    resp.send({status: 'success', posts: result.rows});
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

app.get('/get-forum-sidebar', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let forumSidebar = await client.query(`SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category, category_status, topic_status, subtopic_status
        FROM categories
        LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id
        LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id
        LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic
        WHERE category_status != 'Closed'
        AND topic_status != 'Removed'
        AND topic_status != 'Closed'
        AND subtopic_status != 'Removed'
        GROUP BY belongs_to_topic, subtopic_title, topic_title, category, category_status, topic_status, subtopic_status
        ORDER BY category, topic_title LIKE '%General' DESC, topic_title, subtopic_title`)
        .then((result) => {
            done();
            if (result !== undefined) {
                return result.rows;
            } else {
                resp.send({status: 'error'});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });

        let category = {}
        let last = '';

        for (let item of forumSidebar) {
            category[item.category] = {}
        }

        for (let item of forumSidebar) {
            if (item.topic_title !== last) {
                if (item.category !== null && item.topic_title !== null) {
                    category[item.category][item.topic_title] = {}
                    if (item.subtopic_title !== null) {
                        category[item.category][item.topic_title][item.subtopic_title] = {};
                        category[item.category][item.topic_title][item.subtopic_title] = item.post_count;
                    }
                }

                last = item.topic_title
            } else {
                if (item.category !== null && item.topic_title !== null && item.subtopic_title !== null) {
                    category[item.category][item.topic_title][item.subtopic_title] = item.post_count;
                }

                last = item.topic_title
            }
        }

        resp.send({status: 'success', menu: category});
    });
});

app.post('/get-post-count', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let from = req.body.from,
            page = req.body.page,
            queryString,
            params;

        console.log(typeof req.body.replies)

        if (req.body.replies === 'true') {
            queryString = `SELECT SUM(count_replies) AS total_posts FROM
                (SELECT COUNT(reply_to_post_id) AS count_replies
                FROM posts
                WHERE belongs_to_post_id = $1
                AND reply_to_post_id IS NOT NULL
                AND post_status != 'Removed'
                GROUP BY reply_to_post_id)
            AS p2`;
            params = [from];
        } else {
            queryString = `SELECT COUNT(post_id) AS total_posts 
            FROM posts
            LEFT JOIN subtopics ON subtopics.subtopic_id = posts.post_topic
            WHERE subtopics.subtopic_title = $1
            AND posts.belongs_to_post_id IS NULL
            AND posts.post_status != 'Removed'`;
            params = [fn.capitalize(from).replace('_', ' ')];
        }

        console.log(queryString);

        client.query(queryString, params)
        .then((result) => {
            done();
            if (result !== undefined && result.rows.length === 1) {
                console.log(result.rows)
                let obj = {
                    page: page
                }

                resp.send({status: 'success', total_posts: result.rows[0].total_posts, obj: obj});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });
    });
});

app.post('/get-friends', function(req, resp) {
    if (req.session.user) {
        if (req.body.username === req.session.user.username) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let offset
                    page = parseInt(req.body.page);

                if (page > 1) {
                    offset = (page - 1) * 24;
                } else {
                    offset = 0;
                }

                await client.query("SELECT friends.*, users.online_status, users.last_login, users.avatar_url, users.user_level, CASE WHEN users.hide_email = FALSE THEN users.email END AS email FROM friends LEFT JOIN users ON friends.befriend_with = users.username WHERE friends.friendly_user = $1 AND friends.friend_confirmed IS TRUE ORDER BY users.online_status = 'Online', friends.befriend_with OFFSET $2 LIMIT 24", [req.session.user.username, offset])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].became_friend_on = moment(result.rows[i].became_friend_on).fromNow(); 
                            result.rows[i].last_login = moment(result.rows[i].last_login).fromNow(); 
                        }

                        resp.send({status: 'success', friends: result.rows});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    resp.send({status: 'error'});
                });
            });
        } else {
            fn.error(req, resp, 403, 'You are not allow to retrieve other users\' friends list.');
        }
    } else {
        fn.error(req, resp, 403);
    }
});

/* app.post('/user-menu', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let userMenuQuery;
        let queryParams;
        let loggedIn = false;

        if (req.session.user) {
            userMenuQuery = 'SELECT user_id, username, last_login, user_status, user_level, avatar_url, online_status, fid FROM users LEFT JOIN (SELECT fid, befriend_with FROM friends WHERE friendly_user = $1 AND befriend_with = $2 AND friend_confirmed IS TRUE) AS friends ON users.username = friends.befriend_with WHERE username = $2';
            queryParams = [req.session.user.username, req.body.username];
            loggedIn = req.session.user.username;
        } else {
            userMenuQuery = 'SELECT user_id, username, last_login, user_status, user_level, avatar_url, online_status FROM users WHERE username =$1';
            queryParams = [req.body.username];
        }
        
        await client.query(userMenuQuery, queryParams)
        .then((result) => {
            done();
            if (result !== undefined && result.rows.length === 1) {
                result.rows[0].last_login = moment(result.rows[0].last_login).fromNow();

                resp.send({status: 'success', user: result.rows[0], logged_in: loggedIn});
            } else {
                resp.send({status: 'failed'});
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });
    });
}); */

app.post('/admin-post-details/get-replies', function(req, resp) {
    if (req.session.user && req.session.user.privilege > 1) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let replies = await client.query(`
            SELECT post_id
            FROM posts
            WHERE belongs_to_post_id = $1
            ORDER BY post_created DESC`,
            [req.body.post_id])
            .then((result) => {
                done();
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    let page = parseInt(req.body.page);
                    let obj = {page: page}

                    resp.send({status: 'success', replies: result.rows, obj: obj});
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

module.exports = app;