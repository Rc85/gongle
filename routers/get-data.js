const app = require('express').Router();
const db = require('./db');
const moment = require('moment');
const fn = require('./utils/functions');

app.get('/get-categories', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query('SELECT * FROM categories ORDER BY category')
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
            resp.send({status: 'fail'});
        });
    });
    /* db.query('SELECT * FROM categories ORDER BY category', function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'fail'});
        } else if (result !== undefined) {
            resp.send({status: 'success', categories: result.rows});
        }
    }); */
});

app.post('/get-topics-by-category', function(req, resp) {
    if (req.body.category !== '') {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            await client.query('SELECT * FROM topics WHERE topic_category = $1 ORDER BY topic_title ASC', [req.body.category])
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
                resp.send({status: 'fail'});
            });
        });
        /* db.query('SELECT * FROM topics WHERE topic_category = $1 ORDER BY topic_title ASC', [req.body.category], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'fail'});
            }
            if (result !== undefined) {
                resp.send({status: 'success', topics: result.rows});
            }
        }); */
    } else {
        resp.send({status: 'success'});
    }
});

app.post('/get-subtopics-by-topics', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query('SELECT subtopic_id, subtopic_title FROM subtopics WHERE belongs_to_topic = $1 ORDER BY subtopic_title', [req.body.topic])
        .then((result) => {
            if (result !== undefined) {
                resp.send({status: 'success', subtopics: result.rows});
            }
        })
        .catch((err) => {
            console.log(err);
            resp.send({status: 'fail'});
        });

        done();
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
        var queryString = 'SELECT cat_id AS id, category AS title FROM categories WHERE cat_id > $1 ORDER BY category';
        var param = ['0'];
        var id = req.body.category;
    }

    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        await client.query(queryString, param)
        .then((result) => {
            if (result !== undefined) {
                resp.send({status: 'success', topics: result.rows, id: id});
            } else {
                resp.send({status: 'fail'});
            }
        })
        .catch((err) => {
            console.log(err);
            resp.send({status: 'fail'});
        });

        done();
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
            queryString = "SELECT subtopic_id AS id, subtopic_title AS title, subtopic_created_on AS created_on, belongs_to_topic AS belongs_to, subtopic_status AS status, subtopic_created_by AS created_by, topic_title AS parent_title, topic_id AS parent_id FROM subtopics JOIN topics ON subtopics.belongs_to_topic = topics.topic_id WHERE subtopics.belongs_to_topic = $1 ORDER BY subtopic_title";
            params = [req.body.topic];
        } else {
            queryString = "SELECT topic_id AS id, topic_title AS title, topic_created_on AS created_on, topic_category AS belongs_to, topic_status AS status, topic_created_by AS created_by, category AS parent_title, cat_id AS parent_id FROM topics JOIN categories ON topics.topic_category = categories.cat_id WHERE topics.topic_category = $1 ORDER BY topic_category, topic_title";
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
            if (err) { console.log(err); }
        });

        if (subtopicDetails.length > 0) {
            done();
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

            resp.send({status: 'success', subtopics: obj, results: subtopicDetails});
        } else {
            if (req.body.topic !== '') {
                queryString = 'SELECT topic_id AS parent_id, topic_title AS parent_title FROM topics WHERE topic_id = $1';
                params = [req.body.topic];
            } else {
                queryString = 'SELECT cat_id AS parent_id, category AS parent_title FROM categories WHERE cat_id = $1';
                params = [req.body.category];
            }

            await client.query(queryString, params)
            .then((result) => {
                done();
                if (result !== undefined) {
                    resp.send({status: 'success', subtopics: [], results: result.rows});
                }
            })
            .catch((err) => { console.log(err); });
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
                var queryString = 'SELECT cat_id AS parent_id, category AS parent_title FROM categories WHERE cat_id = $1';
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

        await client.query('SELECT * FROM subtopics WHERE belongs_to_topic = $1', [req.body.topic_id])
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
                let obj = {page: req.body.page}
    
                resp.send({status: 'success', replies: result.rows[0].num_of_replies, obj: obj});
            }
        })
        .catch((err) => { console.log(err); });
    });
});

app.post('/get-user-posts', function(req, resp) {
    if (req.session.user) {
        let page = req.body.page;

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

        db.query(queryString, [req.session.user.username, offset], function(err, result) {
            if (err) {
                console.log(err);
                resp.send({status: 'error'});
            } else if (result !== undefined) {
                for (let i in result.rows) {
                    result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                    result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                }

                resp.send({status: 'success', posts: result.rows});
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.post('/get-post-details', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                if (req.body.page > 1) {
                    var limit = (req.body.page - 1) * 10;
                    var offset = limit;
                } else {
                    var limit = 10;
                    var offset = 0;
                }

                let queryWhereClause = ['belongs_to_post_id IS NULL'];
                let querySearchParams = [limit, offset];

                if (req.body.category !== '' && req.body.category !== undefined) {
                    querySearchParams.push(req.body.category);
                    let index = querySearchParams.indexOf(req.body.category) + 1;
                    queryWhereClause.push('categories.cat_id = $' + index);

                    if (req.body.topic !== '' && req.body.topic !== undefined) {
                        querySearchParams.push(req.body.topic);
                        let index = querySearchParams.indexOf(req.body.topic) + 1;
                        queryWhereClause.push('topics.topic_id = $' + index);
                    }
                }

                if (req.body.post_id !== '' && req.body.post_id !== undefined) {
                    querySearchParams.push(req.body.post_id);
                    let index = querySearchParams.indexOf(req.body.post_id) + 1;
                    queryWhereClause.push('posts.post_id = $' + index);
                }

                if (req.body.subtopic !== '' && req.body.subtopic !== undefined) {
                    querySearchParams.push(req.body.subtopic);
                    let index = querySearchParams.indexOf(req.body.subtopic) + 1;
                    queryWhereClause.push('posts.post_topic = $' + index);
                }

                if (req.body.username !== '' && req.body.username !== undefined) {
                    querySearchParams.push(req.body.username);
                    let index = querySearchParams.indexOf(req.body.username) + 1;
                    queryWhereClause.push('posts.post_user = $' + index);
                }

                if (req.body.status !== '' && req.body.status !== undefined) {
                    querySearchParams.push(req.body.status);
                    let index = querySearchParams.indexOf(req.body.status) + 1;
                    queryWhereClause.push('posts.post_status = $' + index);
                }

                if (req.body.title !== '' && req.body.title !== undefined) {
                    querySearchParams.push(req.body.title);
                    let index = querySearchParams.indexOf(req.body.title) + 1;
                    queryWhereClause.push("posts.post_title LIKE '%' || $" + index + " || '%'");
                }

                var whereClause = 'WHERE ' + queryWhereClause.join(' AND ');
                var queryString = 'SELECT (SELECT COUNT(post_id) AS total_posts FROM posts LEFT JOIN subtopics ON subtopics.subtopic_id = posts.post_topic LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN categories ON categories.cat_id = topics.topic_category ' + whereClause + '), posts.*, user_id, user_status FROM posts LEFT JOIN users ON users.username = posts.post_user LEFT JOIN subtopics ON subtopics.subtopic_id = posts.post_topic LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN categories ON categories.cat_id = topics.topic_category ' + whereClause + ' ORDER BY post_created DESC LIMIT $1 OFFSET $2';

                await client.query(queryString, querySearchParams)
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                            result.rows[i].post_modified = moment(result.rows[i].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');
                        }
    
                        let obj = {
                            page: req.body.page,
                            category: req.body.category,
                            topic: req.body.topic,
                            subtopic: req.body.subtopic
                        }
    
                        resp.send({status: 'success', posts: result.rows, obj: obj});
                    }
                })
                .catch((err) => {
                    console.log(err);
                    resp.send({status: 'error'});
                });
            });
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/get-num-of-posts-in/:subtopic/:page', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let subtopic = req.params.subtopic;
        let page = req.params.page;

        client.query('SELECT COUNT(post_id) AS total_posts FROM posts LEFT JOIN subtopics ON subtopics.subtopic_id = posts.post_topic WHERE subtopics.subtopic_title = $1 AND posts.belongs_to_post_id IS NULL', [fn.capitalize(subtopic).replace('_', ' ')])
        .then((result) => {
            done();
            if (result !== undefined && result.rows.length === 1) {
                let obj = {
                    page: page
                }

                resp.send({status: 'success', total_posts: result.rows[0].total_posts, obj: obj});
            }
        })
        .catch((err) => {
            console.log(err);
            resp.send({status: 'error'});
        });
    });
});

app.post('/get-friends', function(req, resp) {
    if (req.session.user) {
        if (req.body.username === req.session.user.username) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let offset;

                if (req.body.page > 1) {
                    offset = (req.body.page - 1) * 25;
                } else {
                    offset = 0;
                }

                await client.query("SELECT friends.*, users.online_status, users.last_login, users.avatar_url, users.user_level, CASE WHEN users.hide_email = FALSE THEN users.email END AS email FROM friends LEFT JOIN users ON friends.befriend_with = users.username WHERE friends.friendly_user = $1 AND friends.friend_confirmed IS TRUE ORDER BY users.online_status = 'Online', friends.befriend_with OFFSET $2 LIMIT 25", [req.session.user.username, offset])
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

module.exports = app;