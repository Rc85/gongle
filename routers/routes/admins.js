const app = require('express').Router();
const db = require('../db');
const moment = require('moment-timezone');
const fn = require('../utils/functions');

app.get('/admin-page/overview', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.connect(async(err, client, done) => {
                if (err) { console.log(err); }

                let allTopics = await client.query(`SELECT
                    subtopic_title,
                    COUNT(post_id) AS post_count,
                    belongs_to_topic,
                    topic_title,
                    category,
                    cat_icon,
                    category_status
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

                let category = {};
                let last = '';

                /* This loop builds an object that looks like
                    {
                        item.category: {
                            icon: item.cat_icon,
                            status: item.category_status,
                            topics: {}
                        }
                    }
                */
                for (let item of allTopics) {
                    category[item.category] = {}
                    category[item.category]['icon'] = item.cat_icon;
                    category[item.category]['status'] = item.category_status;
                    category[item.category]['topics'] = {}
                }

                /* This loop continues to build the object to look like
                    {
                        item.category: {
                            icon: item.cat_icon,
                            status: item.category_status,
                            topics: {
                                item.topic_title: {
                                    item.subtopic_title: item.post_count
                                }
                            }
                        }
                    }
                */
                for (let item of allTopics) {
                    if (item.topic_title !== last) { // If the previous iteration is not the same as current
                        if (item.category !== null && item.topic_title !== null) {
                            category[item.category]['topics'][item.topic_title] = {} // Create an empty object
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

                resp.render('blocks/admin-overview', {user: req.session.user, categories: category, configs: configs, title: 'Admin Overview'});
            });
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

                let paramString = '';
                let offset;
                let page = req.query.page ? parseInt(req.query.page) : 1;
                let params = [];
                let username = req.query.username;

                if (page > 1) {
                    offset = (page - 1) * 20;
                } else {
                    offset = 0;
                }

                params.push(offset); // params = [offset];

                req.session.user.privilege < 3 ? params.push('2') : params.push('3'); // params = [offset, int]

                /* If URL parameter is provided, it's requesting for another page of users */
                if (req.query) {
                    let i = 3; // The index of params to look for
                    for (let key in req.query) { // Iterate through the URL parameters
                        if (key !== 'offset') { // Skip the offset (the first index) parameter
                            if (req.query[key] !== '') {
                                let newString = ' AND ' + key + ' = $' + i; // build addition WHERE conditions for SQL query
                                paramString += newString; // Concatenate WHERE conditions into a string
                                params.push(req.query[key]); // Store the URL parameters into the params array
                                i++;
                            }
                        }
                    }
                }

                let queryString = `SELECT
                    user_id,
                    username,
                    email,
                    last_login,
                    privilege,
                    user_level,
                    user_status,
                    receive_email,
                    show_online,
                    avatar_url,
                    user_created,
                    user_confirmed 
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

                resp.render('blocks/admin-users', {user: req.session.user, users: users, title: 'Admin Users'});
            });
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

                let category = req.query.category;
                let topic = req.query.topic;
                let subtopic = req.query.subtopic;
                let postId = req.query.post_id;
                let username = req.query.username;
                let status = req.query.status;
                let title = req.query.title;
                let page = parseInt(req.query.page);
                let whereConditions = [`belongs_to_post_id IS NULL`];
                let whereStatement;
                let offset;

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

                resp.render('blocks/admin-posts', {user: req.session.user, posts: posts, url: url, page: page, title: 'Admin Posts'});
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

                let categories = await client.query(`SELECT * FROM categories ORDER BY category LIMIT 25 OFFSET $1`, [offset])
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

                resp.render('blocks/admin-categories', {user: req.session.user, categories: categories, title: 'Admin Categories'});
            });
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
                    queryString = `SELECT
                        topic_id AS id,
                        topic_title AS title,
                        topic_category AS belongs_to_id,
                        topic_created_on AS created_on,
                        topic_created_by AS created_by,
                        topic_status AS status,
                        categories.category AS belongs_to
                    FROM topics
                    LEFT JOIN categories ON topics.topic_category = categories.category_id
                    WHERE topic_category = $1
                    ORDER BY topic_title`;
                    params = [category];
                    type = 'topic';

                    parents = await client.query(`SELECT category_id AS id, category AS name FROM categories ORDER BY category`)
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
                        queryString = `SELECT
                            subtopic_id AS id,
                            subtopic_title AS title,
                            belongs_to_topic AS belongs_to_id,
                            subtopic_created_on AS created_on,
                            subtopic_created_by AS created_by,
                            subtopic_status AS status,
                            topics.topic_title AS belongs_to,
                            categories.category AS category
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
                    create = await client.query(`SELECT category_id AS id, category AS title FROM categories WHERE category_id = $1`, [category])
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
                        create = await client.query(`SELECT
                            topic_id AS id,
                            topic_title AS title,
                            category AS parent
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

                resp.render('blocks/admin-config', {user: req.session.user, config: config, title: 'Admin Config'});
            })
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
            db.connect(async(err, client, done) => {
                if (err) { console.log(err); }

                let reports = await client.query('SELECT * FROM user_reports ORDER BY r_id')
                .then(result => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].reported_on = moment(result.rows[i].reported_on).format('MM/DD/YYYY @ hh:mm:ss A');
                        }

                        return result.rows;
                    }
                })
                .catch(err => {
                    console.log(err);
                    done();
                });

                resp.render('blocks/admin-reports', {user: req.session.user, title: 'Admin Reports', reports: reports});
            });
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

                let replies = await client.query(`SELECT * FROM posts WHERE belongs_to_post_id = $1 ORDER BY post_created DESC OFFSET $2 LIMIT 25`, [postId, offset])
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

                resp.render('blocks/admin-post-details', {orig: originalPost, replies: replies, page: page, title: 'Admin Posts'});
            })
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 403);
    }
});

app.get('/admin-page/review/report', (req, resp) => {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            let id = req.query.id;

            resp.render('blocks/admin-review-report', {user: req.session.user, id: id, title: 'Admin Reports'});
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        resp.render('admin-login', {title: 'Admin Login'});
    }
});

module.exports = app;