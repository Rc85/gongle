const app = require('express').Router();
const db = require('../db');
const moment = require('moment-timezone');
const fn = require('../utils/functions');
const capitalize = require('../utils/capitalize');

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
        
        let title = capitalize(req.params.category.replace('_', ' ')),
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
            let categories = await client.query(`SELECT topics.topic_id, topic_title, topic_status, pt.last_posted, pt.post_user
            FROM topics
            LEFT JOIN categories ON categories.category_id = topics.topic_category
            LEFT JOIN
                (SELECT DISTINCT ON (belongs_to_topic) belongs_to_topic, subtopic_id, subtopic_title 
                FROM subtopics
                LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic
                WHERE subtopic_status != 'Removed') st ON topics.topic_id = st.belongs_to_topic
            LEFT JOIN
                (SELECT DISTINCT ON (topic_id) MAX(post_created) AS last_posted, post_user, topic_id
                FROM posts
                LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id
                LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id
                WHERE post_status != 'Removed'
                GROUP BY topic_id, post_user, post_topic) pt ON pt.topic_id = topics.topic_id
            WHERE category = $1
            AND topic_status != 'Removed'
            ORDER BY topic_title LIKE '%General' DESC, topic_title ASC, pt.last_posted DESC`, [title])
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

app.get('/subforums/:topic', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let topic = capitalize(req.params.topic.replace('_', ' ')),
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
        let topic = capitalize(req.params.topic.replace('_', ' '));
        let subtopic;

        let needsToBeCapitalized = ['cpu', 'kia', 'lg', 'dslr', 'asus', 'htc', 'rca', 'bmw', 'gmc', 'fps', 'mmo', 'moba', 'rpg', 'rts', 'ufc', 'mlb', 'nba', 'nhl', 'nfl']

        if (needsToBeCapitalized.indexOf(req.params.subtopic) > 0) {
            subtopic = req.params.subtopic.replace('_', ' ').toUpperCase().replace('/', '');
        } else {
            subtopic = capitalize(req.params.subtopic.replace('_', ' ').replace('/', ''))
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

        let post_id = req.query.pid;
        let reply_id = req.query.rid;
        let page = req.query.page ? parseInt(req.query.page) : 1;
        let results = {};

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

        if (originalPost.belongs_to_post_id === null) {
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
        } else {
            fn.error(req, resp, 400);
        }
    });
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
});

module.exports = app;