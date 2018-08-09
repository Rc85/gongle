const app = require('express').Router();
const db = require('./db');
const moment = require('moment-timezone');
const fn = require('./utils/functions');
const fs = require('fs');

app.use(/^(?!\/admin-page|\/logout|\/login|\/change-config)/, function(req, resp, next) {
    /* let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    console.log(config);

    if (!config.site) {
        resp.render('closed', {status: 'Closed', message: 'The site is down for maintenance. Please check back later.', title: 'Closed'});
    } else {
        next();
    } */
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }
        
        let config = await client.query('SELECT * FROM config ORDER BY config_id')
        .then((result) => {
            done();
            if (result !== undefined) {
                return result.rows;
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        })

        if (config[1].status === 'Closed') {
            resp.render('closed', {status: 'Closed', message: 'The site is down for maintenance. Please check back later.', title: 'Closed'});
        } else {
            next();
        }
    });
});

app.get('/', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let allTopics = await client.query(
        `SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category, category_status, cat_icon
        FROM categories
        LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id
        LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id
        LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic
        WHERE category_status != 'Removed'
        GROUP BY belongs_to_topic, subtopic_title, topic_title, category, category_status, cat_icon
        ORDER BY category, topic_title
        LIKE '%General' DESC, topic_title, subtopic_title = 'Other' ASC, subtopic_title`
        )
        .then((result) => {
            done();
            if (result !== undefined) {
                return result.rows;
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            fn.error(req, resp, 400)
        });

        let category = {},
            last = '';

        for (let item of allTopics) {
            category[item.category] = {}
            category[item.category]['icon'] = item.cat_icon;
            category[item.category]['status'] = item.category_status;
            category[item.category]['topics'] = {}
        }

        for (let item of allTopics) {
            if (item.topic_title !== last) {
                if (item.category !== null && item.topic_title !== null) {
                    category[item.category]['topics'][item.topic_title] = {}
                    if (item.subtopic_title !== null) {
                        category[item.category]['topics'][item.topic_title][item.subtopic_title] = {};
                        category[item.category]['topics'][item.topic_title][item.subtopic_title] = item.post_count;
                    }
                }

                last = item.topic_title
            } else {
                if (item.category !== null && item.topic_title !== null && item.subtopic_title !== null) {
                    category[item.category]['topics'][item.topic_title][item.subtopic_title] = item.post_count;
                }

                last = item.topic_title
            }
        }

        resp.render('blocks/index', {user: req.session.user, categories: category, title: 'Main'});
    });
});

app.get('/forums', function(req, resp) {
    db.connect(async (err, client, done) => {
        if (err) { console.log(err); }
        
        fn.newActivePopular(client, done, '', 10, function(results) {
            resp.render('forums/forums', {user: req.session.user, popular: results.popular, new_posts: results.new_posts, active: results.active, title: 'Forums'});
        });
    });
});

app.get('/forums/:category', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }
        
        let title = fn.capitalize(req.params.category.replace('_', ' ')),
            moreQuery = `AND categories.category = '${title}'`;

        let status = await client.query(`SELECT category_status FROM categories WHERE category = $1`, [title])
        .then((result) => {
            if (result !== undefined && result.rows.length === 1) {
                return result.rows[0].category_status;
            }
        })
        .catch((err) => {
            console.log(err);
            done();
        });

        if (status !== 'Removed' && status !== undefined) {
            let categories = await client.query(`SELECT topic_title, topic_status, pt.last_posted, pt.post_user
            FROM topics
            LEFT JOIN categories ON categories.category_id = topics.topic_category
            LEFT JOIN
                (SELECT DISTINCT ON (belongs_to_topic) belongs_to_topic, subtopic_id, subtopic_title 
                FROM subtopics
                LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic
                WHERE subtopic_status != 'Removed') st ON topics.topic_id = st.belongs_to_topic
            LEFT JOIN
                (SELECT DISTINCT ON (post_topic) MAX(post_created) AS last_posted, post_user, topic_id
                FROM posts
                LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                WHERE post_status != 'Removed'
                GROUP BY post_user, subtopic_title, post_topic, topic_id) pt ON pt.topic_id = topics.topic_id
            WHERE category = $1
            AND topic_status != 'Removed'
            ORDER BY topic_title LIKE '%General' DESC, topic_title ASC`, [title])
            .then((result) => {
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].last_posted = moment(result.rows[i].last_posted).fromNow();
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });

            fn.newActivePopular(client, done, moreQuery, 10, function(results) {
                resp.render('forums/subforums', {user: req.session.user, subtopics: categories, popular: results.popular, new_posts: results.new_posts, active: results.active, title: title});
            });
        } else {
            done();
            fn.error(req, resp, 403, `The forum you're trying to access is closed.`);
        }
    });
});

app.get('/register', function(req, resp) {
    if (req.session.user) {
        fn.error(req, resp, 400, 'You are logged in');
    } else {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }
            
            await client.query("SELECT * FROM config WHERE config_name = 'Registration'")
            .then((result) => {
                done();
                if (result !== undefined && result.rows[0].status === 'Open') {
                    resp.render('blocks/register', {title: 'Register'});
                } else {
                    fn.error(req, resp, 403, 'Registration is closed. Please check back later.');
                }
            })
            .catch((err) => {
                console.log(err);
                done();
            });
        });
    }
});

app.get('/profile', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let username = req.query.u,
            violations = [];

        let userProfile = await client.query("SELECT COUNT(posts.*) AS posts_count, SUM(posts.post_downvote) AS downvotes, SUM(posts.post_upvote) AS upvotes, avatar_url, user_id, username, email, last_login, user_status, user_level FROM users LEFT OUTER JOIN posts ON users.username = posts.post_user WHERE users.username = $1 AND users.user_id > 3 GROUP BY users.user_id", [username])
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

            console.log(req.session.user);

            resp.render('blocks/profile-friends', {user: req.session.user, viewing: req.session.user, friends: friends, title: 'User - Friends'});
        });
    }
});

app.get('/subforums/:topic', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let topic = fn.capitalize(req.params.topic.replace('_', ' ')),
            moreQuery = `AND topic_title = '${topic}'`;
        
        let status = await client.query(`SELECT topic_status, category_status FROM topics LEFT JOIN categories ON topics.topic_category = categories.category_id WHERE topic_title = $1`, [topic])
        .then((result) => {
            if (result !== undefined && result.rows.length === 1) {
                return result.rows[0];
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });

        if (status !== undefined) {
            if (status.category_status === 'Removed') {
                access = false;
            } else {
                access = true;

                if (status.topic_status === 'Removed') {
                    access = false
                }
            }
        } else {
            access = false;
        }

        if (access) {
            let topics = await client.query(`SELECT subtopics.subtopic_title, topics.topic_title, p2.last_posted, p2.post_user, subtopic_status
            FROM subtopics
            LEFT JOIN topics ON belongs_to_topic = topic_id
            LEFT OUTER JOIN
                (SELECT DISTINCT ON (subtopic_id) MAX(post_created) AS last_posted, post_user, subtopic_id
                FROM posts
                LEFT OUTER JOIN subtopics ON subtopics.subtopic_id = posts.post_topic
                GROUP BY post_user, subtopic_id
                ORDER BY subtopic_id) p2 ON subtopics.subtopic_id = p2.subtopic_id
            WHERE topic_title = $1
            AND subtopic_status != 'Removed'
            GROUP BY subtopics.subtopic_id, topics.topic_title, p2.last_posted, post_user, subtopic_status
            ORDER BY subtopic_title = 'Other' ASC, subtopic_title`, [topic])
            .then((result) => {
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].last_posted = moment(result.rows[i].last_posted).fromNow();
                    }
        
                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            fn.newActivePopular(client, done, moreQuery, 3, function(results) {
                resp.render('forums/subforums', {user: req.session.user, subtopics: topics, title: topic.replace('_', ' '), new_posts: results.new_posts, active: results.active, popular: results.popular});
            });
        } else {
            fn.error(req, resp, 404);
        }
    });
});

app.get('/subforums/:topic/:subtopic', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }
        let topic = fn.capitalize(req.params.topic.replace('_', ' '));
        let subtopic;

        let needsToBeCapitalized = ['cpu', 'kia', 'lg', 'dslr', 'asus', 'htc', 'rca', 'bmw', 'gmc', 'fps', 'mmo', 'moba', 'rpg', 'rts', 'ufc', 'mlb', 'nba', 'nhl', 'nfl']

        if (needsToBeCapitalized.indexOf(req.params.subtopic) > 0) {
            subtopic = req.params.subtopic.replace('_', ' ').toUpperCase().replace('/', '');
        } else {
            subtopic = fn.capitalize(req.params.subtopic.replace('_', ' ').replace('/', ''))
        }

        let status = await client.query(`SELECT category_status, topic_status, subtopic_status
        FROM subtopics
        LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
        LEFT JOIN categories ON topics.topic_category = categories.category_id
        WHERE subtopic_title = $1
        AND topic_title = $2`, [subtopic, topic])
        .then((result) => {
            if (result !== undefined && result.rows.length === 1) {
                return result.rows[0];
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            resp.send({status: 'error'});
        });

        let access;

        if (status !== undefined) {
            if (status.category_status === 'Removed') {
                access = false;
            } else {
                access = true;

                if (status.topic_status === 'Removed') {
                    access = false
                }
            }
        } else {
            access = false;
        }

        if (access) {
            let getTopics = await client.query(`SELECT subtopic_status, subtopic_id, topic_title, category, category_status
            FROM subtopics
            LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic
            LEFT JOIN categories ON categories.category_id = topics.topic_category
            WHERE subtopic_title = $1
            AND topic_title = $2`, [subtopic, topic])
            .then((result) => {
                if (result !== undefined && result.rows.length === 1) {
                    return result.rows;
                } else {
                    fn.error(req, resp, 404);
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            if (getTopics[0].subtopic_status !== 'Removed') {
                let page = req.query.page ? parseInt(req.query.page) : 1,
                    subtopicStatus = getTopics[0].subtopic_status,
                    subtopic_id = getTopics[0].subtopic_id,
                    topicTitle = getTopics[0].topic_title,
                    category = getTopics[0].category,
                    categoryStatus = getTopics[0].category_status;

                if (page > 1) {
                    var limit = (page - 1) * 25;
                    var offset = limit;
                } else {
                    var limit = 25;
                    var offset = 0;
                }

                let posts = await client.query(`SELECT
                    (SELECT COUNT(post_id)
                    FROM posts
                    LEFT JOIN subtopics ON subtopics.subtopic_id = posts.post_topic
                    WHERE subtopic_title = $1
                    AND reply_to_post_id IS NULL
                    AND post_status != 'Removed') AS count,
                posts.*, SUM(posts.replies) AS total_replies, subtopics.subtopic_title, users.username, users.user_id, users.last_login, subtopics.subtopic_id
                FROM posts
                LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                LEFT JOIN users ON users.username = posts.post_user
                WHERE subtopics.subtopic_title = $1
                AND post_status != 'Removed'
                AND reply_to_post_id IS NULL
                GROUP BY posts.post_id, subtopics.subtopic_title, subtopics.subtopic_id, users.user_id
                ORDER BY post_created DESC
                LIMIT $2
                OFFSET $3`, [subtopic, limit, offset])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                            result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                        }

                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    fn.error(req, resp, 500);
                });
                
                resp.render('forums/posts', {user: req.session.user, posts: posts, category_status: categoryStatus, subtopic_status: subtopicStatus, title: subtopic, topic_title: topicTitle, subtopic_id: subtopic_id, category: category, page: page});
            } else {
                fn.error(req, resp, 404);
            }
        } else {
            fn.error(req, resp, 404);
        }
    });
});

app.get('/forums/posts/post-details', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let post_id = req.query.pid,
            reply_id = req.query.rid,
            page = req.query.page ? parseInt(req.query.page) : 1,
            results = {};

        let originalPost = await client.query(
        `SELECT
        posts.*,
        topics.topic_title,
        subtopics.subtopic_title, subtopics.subtopic_status,
        users.user_id, users.last_login, users.user_status
        FROM posts
        LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
        LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic
        LEFT JOIN users ON posts.post_user = users.username
        WHERE posts.post_id = $1
        AND posts.post_status != 'Removed'`,
        [post_id])
        .then((result) => {
            if (result !== undefined) {
                result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
                result.rows[0].post_modified = moment(result.rows[0].post_modified).fromNow();
                result.rows[0].last_login = moment(result.rows[0].last_login).fromNow();

                return result.rows[0];
            } else {
                fn.error(req, resp, 500);
            }
        })
        .catch((err) => {
            console.log(err);
            done();
            fn.error(req, resp, 500);
        });

        results['post'] = originalPost;
        results['replies'] = {};

        if (reply_id) { // if the reply_id query string is provided, get that reply only
            let reply = await client.query(`SELECT orig.*, p2.post_id AS p2_post_id, p2.post_user AS p2_post_user, p2.post_created AS p2_post_created, p2.post_body AS p2_post_body, p2.reply_to_post_id AS p2_reply_to_post_id, users.user_status, users.user_id, users.last_login
            FROM posts orig
            LEFT JOIN users ON orig.post_user = users.username
            LEFT JOIN posts p2 ON orig.reply_to_post_id = p2.post_id
            WHERE orig.post_id = $1
            AND orig.post_status != 'Removed'`, [reply_id])
            .then((result) => {
                done();
                if (result !== undefined && result.rows.length === 1) {
                    result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
                    result.rows[0].post_modified = moment(result.rows[0].post_modified).fromNow();
                    result.rows[0].last_login = moment(result.rows[0].last_login).fromNow();
                    result.rows[0].p2_post_created = moment(result.rows[0].p2_post_created).fromNow();

                    console.log(result.rows[0]);

                    return result.rows[0];
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            results['replies'][reply_id] = reply;

            resp.render('blocks/post-details', {user: req.session.user, posts: results, title: results.post.post_title});
        } else {
            if (page > 1) {
                var offset = (page - 1) * 10;
            } else {
                var offset = 0;
            }

            let repliesWithQuotes = await client.query(`SELECT
                (SELECT COUNT(post_id) AS count
                FROM posts
                WHERE belongs_to_post_id = $1
                AND post_status != 'Removed') AS count,
            orig.*, p2.post_id AS p2_post_id, p2.post_user AS p2_post_user, p2.post_created AS p2_post_created, p2.post_body AS p2_post_body, p2.reply_to_post_id AS p2_reply_to_post_id, users.user_status, users.user_id, users.last_login
            FROM posts orig
            LEFT JOIN posts p2 ON orig.reply_to_post_id = p2.post_id
            LEFT JOIN users ON orig.post_user = users.username
            WHERE orig.belongs_to_post_id = $1
            AND orig.post_status != 'Removed'
            ORDER BY orig.post_created, p2.post_created DESC
            OFFSET $2
            LIMIT 10`, [post_id, offset])
            .then((result) => {
                done();

                console.log(result.rows);
                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                        result.rows[i].p2_post_created = moment(result.rows[i].p2_post_created).fromNow();
                        result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                    }

                    return result.rows;
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            results['replies'] = repliesWithQuotes;

            resp.render('blocks/post-details', {user: req.session.user, posts: results, title: results.post.post_title, page: page});
        }
    });

    /* db.query("SELECT posts.*, topics.topic_title, subtopics.subtopic_title, users.user_id, users.last_login FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic LEFT JOIN users ON posts.post_user = users.username WHERE posts.post_id = $1 AND posts.post_status != 'Removed'", [post_id], function(err, result) {
        if (err) { console.log(err); }

        if (result !== undefined && result.rows.length === 1) {
            result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
            result.rows[0].post_modified = moment(result.rows[0].post_modified).fromNow();
            result.rows[0].last_login = moment(result.rows[0].last_login).fromNow();
            console.log(result.rows)
            let results = {
                post: result.rows[0]
            }

            if (reply_id) {
                db.query("SELECT * FROM posts LEFT JOIN users ON posts.post_user = users.username WHERE post_id = $1 AND post_status != 'Removed'", [reply_id, show_posts], function(err, result) {
                    if (err) { console.log(err); }

                    if (result !== undefined) {
                        results['replies'] = {}

                        result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();
                        result.rows[0].post_modified = moment(result.rows[0].post_modified).fromNow();
                        result.rows[0].last_login = moment(result.rows[0].last_login).fromNow();
                        results['replies'][reply_id] = result.rows[0];

                        resp.render('blocks/post-details', {user: req.session.user, posts: results, title: results.post.post_title});
                    }
                });
            } else {
                if (page > 1) {
                    var offset = (page - 1) * 10;
                } else {
                    var offset = 0;
                }

                db.query("SELECT orig.*, p2.post_id AS p2_post_id, p2.post_user AS p2_post_user, p2.post_created AS p2_post_created, p2.post_body AS p2_post_body, p2.reply_to_post_id AS p2_reply_to_post_id, users.user_status, users.user_id, users.last_login FROM posts orig LEFT JOIN posts p2 ON orig.reply_to_post_id = p2.post_id LEFT JOIN users ON orig.post_user = users.username WHERE orig.belongs_to_post_id = $1 AND  orig.post_status != 'Removed' ORDER BY orig.post_created, p2.post_created DESC OFFSET $2 LIMIT 10", [post_id, offset], function(err, result) {
                    if (err) { console.log(err); }

                    if (result !== undefined) {
                        results['replies'] = {}

                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                            result.rows[i].post_modified = moment(result.rows[i].post_modified).fromNow();
                            result.rows[i].p2_post_created = moment(result.rows[i].p2_post_created).fromNow();
                            result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                            //let reply_id = result.rows[i].post_id;
                            //results['replies'][reply_id] = result.rows[i];
                        }
                        results['replies'] = result.rows;
    
                        resp.render('blocks/post-details', {user: req.session.user, posts: results, title: results.post.post_title});
                    }
                });
            }
        }
    }); */
});

app.get('/edit-post', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let post_id = req.query.pid;

            let post = await client.query("SELECT * FROM posts JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE post_id = $1 AND post_status != 'Removed'", [post_id])
            .then((result) => {
                done();
                if (result !== undefined && result.rows.length === 1) {
                    result.rows[0].post_created = moment(result.rows[0].post_created).fromNow();

                    return result.rows[0];
                }
            })
            .catch((err) => {
                console.log(err);
                done();
                fn.error(req, resp, 500);
            });

            resp.render('blocks/edit-post', {user: req.session.user, post: post, title: 'Edit Post'});
        });
    } else {
        fn.error(req, resp, 403);
    }

    /* if (req.session.user) {
        db.query("SELECT * FROM posts JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE post_id = $1 AND post_status != 'Removed'", [post_id], function(err, result) {
            if (err) {
                console.log(err);
                fn.error(req, resp, 500);
            } else if (result !== undefined && result.rows.length === 1) {
                resp.render('blocks/edit-post', {user: req.session.user, post: result.rows[0], title: 'Edit Post'});
            }
        });
    } else {
        fn.error(req, resp, 403);
    } */
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

app.get('/admin-page/overview', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let allTopics = await client.query(`
                SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category, cat_icon, category_status
                FROM categories
                LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id
                LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id
                LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic
                GROUP BY belongs_to_topic, subtopic_title, topic_title, category, cat_icon, category_status
                ORDER BY category, topic_title, subtopic_title`)
                .then((result) => {
                    if (result !== undefined) {
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

                let category = {},
                    last = '';

                for (let item of allTopics) {
                    category[item.category] = {}
                    category[item.category]['icon'] = item.cat_icon;
                    category[item.category]['status'] = item.category_status;
                    category[item.category]['topics'] = {}
                }

                for (let item of allTopics) {
                    if (item.topic_title !== last) {
                        if (item.category !== null && item.topic_title !== null) {
                            category[item.category]['topics'][item.topic_title] = {}
                            if (item.subtopic_title !== null) {
                                category[item.category]['topics'][item.topic_title][item.subtopic_title] = {};
                                category[item.category]['topics'][item.topic_title][item.subtopic_title] = item.post_count;
                            }
                        }

                        last = item.topic_title
                    } else {
                        if (item.category !== null && item.topic_title !== null && item.subtopic_title !== null) {
                            category[item.category]['topics'][item.topic_title][item.subtopic_title] = item.post_count;
                        }

                        last = item.topic_title
                    }
                }

                let configs = await client.query('SELECT * FROM config ORDER BY config_id')
                .then((result) => {
                    done();
                    if (result !== undefined) {
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

                console.log(category);

                resp.render('blocks/admin-overview', {user: req.session.user, page: 'overview', categories: category, configs: configs, title: 'Admin Overview'});
            });
            /* db.query('SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category FROM categories LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic GROUP BY belongs_to_topic, subtopic_title, topic_title, category ORDER BY category, topic_title, subtopic_title', function(err, result) {
                if (err) { console.log(err); }

                if (result !== undefined) {
                    let category = {}
                    let last = '';

                    for (let item of result.rows) {
                        category[item.category] = {}
                    }

                    for (let item of result.rows) {
                        if (item.topic_title !== null) {
                            if (item.topic_title !== last) {
                                category[item.category][item.topic_title] = {}
                                category[item.category][item.topic_title][item.subtopic_title] = {};
                                category[item.category][item.topic_title][item.subtopic_title] = item.post_count;
                                last = item.topic_title
                            } else {
                                category[item.category][item.topic_title][item.subtopic_title] = item.post_count;
                                last = item.topic_title
                            }
                        }
                    }

                    db.query('SELECT * FROM config ORDER BY config_id', function(err, result) {
                        if (err) { console.log(err); }

                        if (result !== undefined) {
                            resp.render('blocks/admin-overview', {user: req.session.user, page: 'overview', categories: category, configs: result.rows, title: 'Admin Overview'});
                        }
                    });
                }
            }); */
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/users', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let paramString = '',
                    offset,
                    page = req.query.page ? parseInt(req.query.page) : 1,
                    params = [],
                    username = req.query.username;

                if (page > 1) {
                    offset = (page - 1) * 20;
                } else {
                    offset = 0;
                }

                params.push(offset);

                if (req.session.user.privilege < 3) {
                    params.push('2');
                } else {
                    params.push('3');
                }

                /* if URL parameter is provided, it's requesting for another page of users */
                /* NOT YET TESTED */
                if (req.query) {
                    let i = 3; // set page number to 2
                    for (let key in req.query) { // iterate through the URL parameters
                        if (key !== 'offset') { // skip the offset parameter
                            if (req.query[key] !== '') {
                                let newString = ' AND ' + key + ' = $' + i; // build addition WHERE conditions
                                paramString += newString; // concatenate conditions
                                params.push(req.query[key]); // store them in array to use in our query function
                                i++;
                            }
                        }
                    }
                }

                let queryString = `SELECT
                user_id, username, email, last_login, privilege, user_level, user_status, receive_email, show_online, avatar_url, user_created, user_confirmed 
                FROM users 
                WHERE user_level != 'Owner'
                AND privilege < $2
                ${paramString}
                ORDER BY username 
                OFFSET $1 
                LIMIT 20`;

                let users = await client.query(queryString, params)
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].user_created = moment(result.rows[i].user_created).format('MM/DD/YYYY @ hh:mm:ss A');
                            result.rows[i].user_confirmed = moment(result.rows[i].user_confirmed).format('MM/DD/YYYY @ hh:mm:ss A');
                            result.rows[i].last_login = moment(result.rows[i].last_login).format('MM/DD/YYYY @ hh:mm:ss A');
                        }

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

                resp.render('blocks/admin-users', {user: req.session.user, page: 'users', users: users, title: 'Admin Users'});
            });

            /* db.query(queryString, params, function(err, result) {
                if (err) { console.log(err); }

                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].user_created = moment(result.rows[i].user_created).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[i].user_confirmed = moment(result.rows[i].user_confirmed).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[i].last_login = moment(result.rows[i].last_login).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    resp.render('blocks/admin-users', {user: req.session.user, page: 'users', users: result.rows, title: 'Admin Users'});
                }
            }); */
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/posts', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let category = req.query.category,
                    topic = req.query.topic,
                    subtopic = req.query.subtopic,
                    postId = req.query.post_id,
                    username = req.query.username,
                    status = req.query.status,
                    title = req.query.title,
                    page = parseInt(req.query.page),
                    whereConditions = [`belongs_to_post_id IS NULL`],
                    whereStatement,
                    offset;

                if (page !== 'NaN' && page > 1) {
                    offset = (page - 1) * 10;
                } else {
                    page = 1;
                    offset = 0;
                }

                let params = [offset];

                if (category !== '' && category !== undefined) {
                    params.push(category);
                    let index = params.length;
                    whereConditions.push(`categories.category_id = $${index}`);

                    if (topic !== '' && topic !== undefined) {
                        params.push(topic);
                        let index = params.length;
                        whereConditions.push(`topics.topic_id = $${index}`);
                    }

                    if (subtopic !== '' && subtopic !== undefined) {
                        params.push(subtopic);
                        let index = params.length;
                        whereConditions.push(`subtopics.subtopic_id = $${index}`);
                    }

                    if (postId !== '' && postId !== undefined) {
                        params.push(postId);
                        let index = params.length;
                        whereConditions.push(`posts.post_id = $${index}`);
                    }

                    if (username !== '' && username !== undefined) {
                        params.push(username);
                        let index = params.length;
                        whereConditions.push(`posts.post_user = $${index}`);
                    }

                    if (status !== '' && status !== undefined) {
                        params.push(status);
                        let index = params.length;
                        whereConditions.push(`posts.post_status = $${index}`);
                    }

                    if (title !== '' && title !== undefined) {
                        params.push(title);
                        let index = params.length;
                        whereConditions.push(`posts.post_title LIKE % || $${index} || %`);
                    }
                }

                whereStatement = `WHERE ${whereConditions.join(' AND ')}`;
                let queryString = `SELECT (
                    SELECT COUNT(post_id) AS count
                    FROM posts
                    LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                    LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                    LEFT JOIN categories ON topics.topic_category = categories.category_id
                    ${whereStatement}
                ) AS count, posts.*
                FROM posts
                LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                LEFT JOIN categories ON topics.topic_category = categories.category_id
                ${whereStatement}
                ORDER BY post_created DESC
                LIMIT 10
                OFFSET $1`;

                console.log(queryString)
                console.log(params);

                let posts;
                
                if (whereConditions.length > 1) {
                    posts = await client.query(queryString, params)
                    .then((result) => {
                        done();
                        if (result !== undefined) {
                            for (let i in result.rows) {
                                result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                                result.rows[i].post_modified = moment(result.rows[i].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');
                            }
                            return result.rows;
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });
                } else {
                    posts = [];
                }

                let url = `/admin-page/posts?category=${category}&topic=${topic}&subtopic=${subtopic}&post_id=${postId}&username=${username}&status=${status}&title=${title}`

                resp.render('blocks/admin-posts', {user: req.session.user, posts: posts, url: url, page: page});
            });
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/categories', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let offset,
                    page = parseInt(req.query.page);

                if (page > 1) {
                    offset = (page - 1) * 25;
                } else {
                    offset = 0;
                }

                let categories = await client.query(
                `SELECT *
                FROM categories
                ORDER BY category
                LIMIT 25
                OFFSET $1`,
                [offset]
                )
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].cat_created_on = moment(result.rows[i].cat_created_on).format('MM/DD/YYYY @ hh:mm:ss A');
                        }

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

                resp.render('blocks/admin-categories', {user: req.session.user, page: 'categories', categories: categories, title: 'Admin Categories'});
            });
            /* db.query('SELECT * FROM categories', function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 500);
                } else if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].cat_created_on = moment(result.rows[i].cat_created_on).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    resp.render('blocks/admin-categories', {user: req.session.user, page: 'categories', categories: result.rows, title: 'Admin Categories'});
                }
            }) */
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/topics', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err);}

                let category = req.query.category,
                    topic = req.query.topic,
                    params,
                    type,
                    queryString,
                    parents,
                    results = [],
                    create = [];

                if (category !== '' && category !== undefined) {
                    queryString = `SELECT topic_id AS id, topic_title AS title, topic_category AS belongs_to_id, topic_created_on AS created_on, topic_created_by AS created_by, topic_status AS status, categories.category AS belongs_to
                    FROM topics
                    LEFT JOIN categories ON topics.topic_category = categories.category_id
                    WHERE topic_category = $1
                    ORDER BY topic_title`;
                    params = [category];
                    type = 'topic';

                    parents = await client.query(`SELECT category_id AS id, category AS name
                    FROM categories
                    ORDER BY category`)
                    .then((result) => {
                        if (result !== undefined) {
                            return result.rows;
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        done();
                    });

                    if (topic !== '' && topic !== undefined) {
                        queryString = `SELECT subtopic_id AS id, subtopic_title AS title, belongs_to_topic AS belongs_to_id, subtopic_created_on AS created_on, subtopic_created_by AS created_by, subtopic_status AS status, topics.topic_title AS belongs_to, categories.category AS category
                        FROM subtopics
                        LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                        LEFT JOIN categories ON topics.topic_category = categories.category_id
                        WHERE belongs_to_topic = $1
                        ORDER BY subtopic_title`;
                        params = [topic];
                        type = 'subtopic';

                        parents = await client.query(`SELECT topic_id AS id, topic_title AS name
                        FROM topics
                        WHERE topic_category = $1
                        AND topic_title NOT LIKE '%General'
                        ORDER BY topic_title`, [category])
                        .then((result) => {
                            if (result !== undefined) {
                                return result.rows;
                            }
                        })
                        .catch((err) => {
                            console.log(err);
                            done();
                        });
                    }
                }

                if (category !== '' && category !== undefined) {
                    results = await client.query(queryString, params)
                    .then((result) => {
                        if (result !== undefined) {
                            for (let i in result.rows) {
                                result.rows[i].created_on = moment(result.rows[i].created_on).format('MM/DD/YYYY @ hh:mm:ss A');
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

                if (category !== '' && category !== undefined) {
                    create = await client.query(`SELECT category_id AS id, category AS title
                    FROM categories
                    WHERE category_id = $1`, [category])
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

                    if (topic !== '' && topic !== undefined) {
                        create = await client.query(`SELECT topic_id AS id, topic_title AS title, category AS parent
                        FROM topics
                        LEFT JOIN categories ON topics.topic_category = categories.category_id
                        WHERE topic_id = $1`, [topic])
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
                    }
                }

                done();

                resp.render('blocks/admin-topics', {
                    user: req.session.user,
                    results: results,
                    type: type,
                    create: create,
                    page: 'topics',
                    title: 'Admin Topics',
                    parents: parents,
                });
            });
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/config', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let config = await client.query('SELECT * FROM config ORDER BY config_id')
                .then((result) => {
                    done();
                    if (result !== undefined) {
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

                resp.render('blocks/admin-config', {user: req.session.user, page: 'config', config: config, title: 'Admin Config'});
            })
            /* db.query('SELECT * FROM config ORDER BY config_id', function(err, result) {
                if (err) { console.log(err); }

                resp.render('blocks/admin-config', {user: req.session.user, page: 'config', config: result.rows, title: 'Admin Config'});
            }); */
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/reports', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            resp.render('blocks/admin-reports', {user: req.session.user, page: 'reports', title: 'Admin Reports'});
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            resp.redirect('/admin-page/overview');
        } else {
            resp.render('admin-login', {message: 'You\'re not authorized', title: 'Admin Login'});
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

app.get('/admin-page/posts/details', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async function(err, client, done) {
                if (err) { console.log(err); }

                let postId = req.query.pid;
                let page = parseInt(req.query.page);
                let offset;

                let originalPost = await client.query('SELECT * FROM posts WHERE post_id = $1', [postId])
                .then((result) => {
                    if (result !== undefined && result.rows.length === 1) {
                        result.rows[0].post_created = moment(result.rows[0].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[0].post_modified = moment(result.rows[0].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');

                        return result.rows[0];
                    } else {
                        fn.error(req, resp, 404);
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    fn.error(req, resp, 500);
                });

                if (page > 1) {
                    offset = (page - 1) * 25;
                } else {
                    offset = 0;
                }

                console.log(page, offset);

                let replies = await client.query(`
                SELECT *
                FROM posts
                WHERE belongs_to_post_id = $1
                ORDER BY post_created DESC
                OFFSET $2
                LIMIT 25`,
                [postId, offset])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                            result.rows[i].post_modified = moment(result.rows[i].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');
                        }

                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    fn.error(req, resp, 500);
                });

                resp.render('blocks/admin-post-details', {orig: originalPost, replies: replies, page: 'posts', title: originalPost.post_title});
            })
            
            /* db.query('SELECT * FROM posts WHERE post_id = $1', [postId], function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 400);
                } else if (result !== undefined && result.rows.length === 1) {
                    result.rows[0].post_created = moment(result.rows[0].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                    result.rows[0].post_modified = moment(result.rows[0].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');

                    let orig = result.rows[0];

                    db.query('SELECT * FROM posts WHERE belongs_to_post_id = $1 ORDER BY post_created DESC', [postId], function(err, result) {
                        if (err) {
                            console.log(err);
                            fn.error(req, resp, 400);
                        } else if (result !== undefined) {
                            for (let i in result.rows) {
                                result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                                result.rows[i].post_modified = moment(result.rows[i].post_modified).format('MM/DD/YYYY @ hh:mm:ss A');
                            }
                            resp.render('blocks/admin-post-details', {orig: orig, replies: result.rows, page: 'posts', title: orig.post_title});
                        }
                    });
                } else {
                    fn.error(req, resp, 404);
                }
            }) */
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 403);
    }
});

app.get('/messages', function(req, resp) {
    if (req.session.user) {
        resp.redirect('/messages/inbox?key=' + req.session.user.session_key);
    } else {
        fn.error(req, resp, 403);
    }
});

app.get('/messages/:location', function(req, resp) {
    if (req.session.user) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }

            let validatedKey = fn.validateKey(req);

            if (validatedKey === req.session.user.username) {
                let outbox = [],
                    inbox = [],
                    deletedMessagesArray = [];

                await client.query('SELECT * FROM deleted_messages WHERE msg_deleted_by = $1', [req.session.user.username])
                .then((result) => {
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            deletedMessagesArray.push(result.rows[i].deleted_msg);
                        }
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                });

                let deletedMessagesIds;
                let deletedMessagesQuery;
                deletedMessagesIds = deletedMessagesArray.join(',');

                if (deletedMessagesArray.length > 0) {
                    deletedMessagesQuery = 'SELECT * FROM messages WHERE (sender = $1 OR recipient = $1) AND message_id NOT IN (' + deletedMessagesIds + ') ORDER BY message_date DESC';
                } else {
                    deletedMessagesQuery = 'SELECT * FROM messages WHERE sender = $1 OR recipient = $1 ORDER BY message_date DESC';
                }

                let allMessages = await client.query(deletedMessagesQuery, [req.session.user.username])
                .then((result) => {
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].message_date = moment(result.rows[i].message_date).format('MM/DD/YYYY @ hh:mm:ss A')

                            if (result.rows[i].sender === req.session.user.username) {
                                outbox.push(result.rows[i]);
                            } else {
                                inbox.push(result.rows[i]);
                            }
                        }

                        return result.rows;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    fn.error(req, resp, 500);
                });

                let starredIdArray = [];

                /* let starredIds = await client.query('SELECT saved_msg FROM saved_messages WHERE msg_saved_by = $1', [req.session.user.username])
                .then((result) => {
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            starredIdArray.push(result.rows[i].saved_msg);
                        }

                        let starredIds = starredIdArray.join(',');

                        return starredIds;
                    }
                })
                .catch((err) => {
                    console.log(err);
                    done();
                    fn.error(req, resp, 500);
                });

                let getStarredMessages;

                if (starredIdArray.length > 0) {
                    getStarredMessages = 'SELECT * FROM messages WHERE message_id IN (' + starredIds + ')';
                } else {
                    getStarredMessages = 'SELECT * FROM messages WHERE message_id IS NULL';
                } */

                let messages;

                let starredMessages = await client.query('SELECT messages.sender, messages.recipient, messages.subject, messages.message, messages.message_status, saved_messages.msg_saved_on AS message_date, saved_messages.msg_saved_by, saved_messages.saved_msg AS message_id FROM saved_messages LEFT JOIN messages ON saved_msg = messages.message_id WHERE msg_saved_by = $1', [req.session.user.username])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].message_date = moment(result.rows[i].message_date).format('MM/DD/YYYY @ hh:mm:ss A');
                            starredIdArray.push(result.rows[i].saved_msg);
                        }

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

                if (req.params.location === 'inbox') {
                    messages = inbox;
                } else if (req.params.location === 'outbox') {
                    messages = outbox;
                } else if (req.params.location === 'starred') {
                    messages = starredMessages;
                }

                if (req.params.location !== 'content') {
                    resp.render('blocks/messages', {user: req.session.user, messages: messages, saved_messages: starredIdArray, title: 'Messages', location: req.params.location});
                } else {
                    let message;
                    let messageId = parseInt(req.query.id);
                    if (req.query.location === 'inbox') {
                        await client.query("UPDATE messages SET message_status = 'Read' WHERE message_id = $1", [req.query.id])
                        .catch((err) => {
                            console.log(err);
                            done();
                        });
                    }

                    for (let msg of allMessages) {
                        if (msg.message_id === messageId) {
                            message = msg;
                        }
                    }

                    resp.render('blocks/message', {user: req.session.user, message: message, saved_messages: starredIdArray, title: message.subject, location: req.query.location});
                }
            } else {
                fn.error(req, resp, 401);
            }
        });
        /* let validatedKey = fn.validateKey(req);

        if (validatedKey === req.session.user.username) {
            db.query('SELECT * FROM messages WHERE sender = $1 OR recipient = $1 ORDER BY message_date DESC', [req.session.user.username], function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 400);
                } else if (result !== undefined) {
                    let allMessages = result.rows;
                    let inbox = [];
                    let outbox = [];

                    for (let i in result.rows) {
                        result.rows[i].message_date = moment(result.rows[i].message_date).format('MM/DD/YYYY @ hh:mm:ss A')

                        if (result.rows[i].sender === req.session.user.username) {
                            outbox.push(result.rows[i]);
                        } else {
                            inbox.push(result.rows[i]);
                        }
                    }

                    db.query('SELECT saved_msg FROM saved_messages WHERE msg_saved_by = $1', [req.session.user.username], function(err, result) {
                        if (err) {
                            console.log(err);
                            fn.error(req, resp, 400);
                        } else if (result !== undefined) {
                            let starredIdArray = [];
    
                            for (let i in result.rows) {
                                starredIdArray.push(result.rows[i].saved_msg);
                            }
                            
                            let joinedIds = starredIdArray.join(',');
                            let savedMessages
                            
                            if (starredIdArray.length > 1) {
                                savedMessages = joinedIds.slice(0, -1);
                            } else {
                                savedMessages = starredIdArray.toString();
                            }
                            
                            let queryString;

                            if (starredIdArray.length > 0) {
                                queryString = 'SELECT * FROM messages WHERE message_id IN (' + savedMessages + ')';
                            } else {
                                queryString = 'SELECT * FROM messages WHERE message_id IS NULL';
                            }
    
                            db.query(queryString, function(err, result) {
                                if (err) {
                                    console.log(err);
                                    fn.error(req, resp, 400);
                                } else if (result !== undefined) {
                                    let messages;

                                    if (req.params.location === 'inbox') {
                                        messages = inbox;
                                    } else if (req.params.location === 'outbox') {
                                        messages = outbox;
                                    } else if (req.params.location === 'starred') {
                                        messages = result.rows;
                                    }

                                    if (req.params.location !== 'content') {
                                        resp.render('blocks/messages', {user: req.session.user, messages: messages, starred_messages: starredIdArray, title: 'Messages', location: req.params.location});
                                    } else {
                                        let message;
                                        let messageId = parseInt(req.query.id);

                                        for (let msg of allMessages) {
                                            if (msg.message_id === messageId) {
                                                message = msg;
                                            }
                                        }

                                        resp.render('blocks/message', {user: req.session.user, message: message, starred_messages: starredIdArray, title: message.subject, location: req.query.location});
                                    }
                                }
                            });
                        }
                    });
                }
            });
        } else {
            fn.error(req, resp, 401);
        } */
    } else {
        fn.error(req, resp, 403);
    }
});

/* app.get('/message/content', function(req, resp) {
    if (req.session.user) {
        let messageId = req.query.id;
        let location = req.query.location;
        let validatedKey = fn.validateKey(req);

        if (validatedKey === req.session.user.username) {
            db.query('SELECT * FROM messages WHERE message_id = $1', [messageId], function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 400);
                } else if (result !== undefined && result.rows.length === 1) {
                    result.rows[0].message_date = moment(result.rows[0].message_date).format('MM/DD/YYYY @ hh:mm:ss A');

                    resp.render('blocks/message', {user: req.session.user, message: result.rows[0], title: result.rows[0].subject, location: location});
                }
            });
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 403);
    }
}); */

app.get('/message/compose', function(req, resp) {
    if (req.session.user) {
        resp.render('blocks/message', {user: req.session.user, title: 'Compose Message', location: 'compose'});
    } else {
        fn.error(req, resp, 403);
    }
});

app.get('/about', (req, resp) => {
    resp.render('blocks/about');
});

app.get('/tos', (req, resp) => {
    resp.render('blocks/tos');
});

app.get('/privacy', (req, resp) => {
    resp.render('blocks/privacy');
});

app.get('/search', (req, resp) => {
    resp.render('blocks/search');
});

app.get('/contact', (req, resp) => {
    resp.render('blocks/contact');
});

app.get('/logout', function(req, resp) {
    req.session = null;

    resp.redirect(req.get('referer'));
});

module.exports = app;