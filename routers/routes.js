const app = require('express').Router();
const CryptoJS = require('crypto-js');
const db = require('./db');
const moment = require('moment-timezone');
const fn = require('./utils/functions');

app.use(/^(?!\/admin-page|\/logout|\/login|\/change-config)/, function(req, resp, next) {
    db.query('SELECT * FROM config ORDER BY config_id', function(err, result) {
        if (err) { console.log(err); }

        if (result !== undefined) {
            if (result.rows[1].status === 'Closed') {
                resp.render('closed', {status: 'Closed', message: 'The site is down for maintenance. Please check back later.', title: 'Closed'});
            } else {
                next();
            }
        }
    });
});

app.get('/', function(req, resp) {
    db.query("SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category FROM categories LEFT OUTER JOIN topics ON topics.topic_category = categories.cat_id LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic GROUP BY belongs_to_topic, subtopic_title, topic_title, category ORDER BY category, topic_title LIKE '%General' DESC, topic_title, subtopic_title", function(err, result) {
        if (err) {
            console.log(err);
            resp.send({status: 'error'});
        }

        if (result !== undefined) {
            let category = {}
            let last = '';

            for (let item of result.rows) {
                category[item.category] = {}
            }

            for (let item of result.rows) {
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

            resp.render('blocks/index', {user: req.session.user, categories: category, title: 'Main'});
        }
    });
});

app.get('/forums', function(req, resp) {
    fn.newActivePopular('', 10, function(results) {
        resp.render('forums/forums', {user: req.session.user, popular: results.popular, new_posts: results.new_posts, active: results.active, title: 'Forums'});
    });
});

app.get('/forums/:category', function(req, resp) {
    let title = fn.capitalize(req.params.category.replace('_', ' '));
    let moreQuery = " AND categories.category = '" + title + "'";
    db.query("SELECT topic_title, pt.last_posted, pt.post_user FROM topics LEFT JOIN categories ON categories.cat_id = topics.topic_category LEFT JOIN (SELECT DISTINCT ON (belongs_to_topic) belongs_to_topic, subtopic_id, subtopic_title FROM subtopics LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic) st ON topics.topic_id = st.belongs_to_topic LEFT JOIN (SELECT DISTINCT ON (post_topic) MAX(post_created) AS last_posted, post_user, topic_id FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id GROUP BY post_user, subtopic_title, post_topic, topic_id) pt ON pt.topic_id = topics.topic_id WHERE category = $1 ORDER BY subtopic_title LIKE '%General' DESC, subtopic_title", [title], function(err, result) {
        if (err) {
            console.log(err);
            fn.error(req, resp, 500);
        } else if (result !== undefined) {
            for (let i in result.rows) {
                result.rows[i].last_posted = moment(result.rows[i].last_posted).fromNow();
            }

            fn.newActivePopular(moreQuery, 10, function(results) {
                console.log(result.rows);
                resp.render('forums/subforums', {user: req.session.user, subtopics: result.rows, popular: results.popular, new_posts: results.new_posts, active: results.active, title: title});
            });
        }
    });
});

app.get('/register', function(req, resp) {
    if (req.session.user) {
        fn.error(req, resp, 400, 'You\'re already logged in. No need to register.');
    } else {
        db.query("SELECT * FROM config WHERE config_name = 'Registration'", function(err, result) {
            if (err) { console.log(err); }

            if (result !== undefined && result.rows[0].status === 'Open') {
                resp.render('blocks/register', {title: 'Register'});
            } else {
                fn.error(req, resp, 403, 'Registration is closed. Please check back later.');
            }
        });
    }
});

app.get('/profile', function(req, resp) {
    let username = req.query.u;

    db.query("SELECT COUNT(posts.*) AS posts_count, SUM(posts.post_downvote) AS downvotes, SUM(posts.post_upvote) AS upvotes, avatar_url, user_id, username, email, last_login, user_status, user_level FROM users LEFT OUTER JOIN posts ON users.username = posts.post_user WHERE users.username = $1 AND users.user_id > 3 GROUP BY users.user_id", [username], function(err, result) {
        if (err) {
            console.log(err);
            fn.error(req, resp, 500);
        } else if (result !== undefined) {
            if (result.rows.length === 1) {
                result.rows[0].last_login = moment.tz(result.rows[0].last_login, 'America/Vancouver').format('MM/DD/YY @ h:mm A z');
                let viewing = result.rows[0];

                if (req.session.user) {
                    db.query('SELECT violations.*, users.username FROM violations LEFT JOIN users ON violations.v_issued_by = users.user_id WHERE v_user_id = $1 ORDER BY v_date DESC', [req.session.user.user_id], function(err, result) {
                        if (err) {
                            console.log(err);
                            fn.error(req, resp, 500);
                        } else if (result !== undefined) {
                            for (let i in result.rows) {
                                result.rows[i].v_date = moment(result.rows[i].v_date).format('MM/DD/YYYY @ hh:mm:ss A');
                            }
    
                            resp.render('blocks/profile', {user: req.session.user, viewing: viewing, violations: result.rows, title: 'Profile'});
                        }
                    });
                } else {
                    resp.render('blocks/profile', {user: req.session.user, viewing: viewing, violations: [], title: 'Profile'});
                }
            } else {
                fn.error(req, resp, 401);
            }
        }
    });
});

app.get('/subforums/:topic', function(req, resp) {
    let topic = fn.capitalize(req.params.topic.replace('_', ' '));
    let moreQuery = " AND topic_title = '" + topic + "'";

    db.query("SELECT CASE WHEN subtopics.subtopic_title LIKE '%Others' THEN 'Others' ELSE subtopics.subtopic_title END, topics.topic_title, p2.last_posted, p2.post_user FROM subtopics LEFT JOIN topics ON belongs_to_topic = topic_id LEFT OUTER JOIN (SELECT DISTINCT ON (subtopic_id) MAX(post_created) AS last_posted, post_user, subtopic_id FROM posts LEFT OUTER JOIN subtopics ON subtopics.subtopic_id = posts.post_topic GROUP BY post_user, subtopic_id ORDER BY subtopic_id) p2 ON subtopics.subtopic_id = p2.subtopic_id WHERE topic_title = $1 GROUP BY subtopics.subtopic_id, topics.topic_title, p2.last_posted, post_user ORDER BY subtopic_title, subtopic_title LIKE '%Others' ASC", [topic], function(err, result) {
        if (err) {
            console.log(err);
            fn.error(req, resp, 500);
        } else if (result !== undefined) {
            console.log(result.rows);
            for (let i in result.rows) {
                result.rows[i].last_posted = moment(result.rows[i].last_posted).fromNow();
            }

            fn.newActivePopular(moreQuery, 3, function(results) {
                resp.render('forums/subforums', {user: req.session.user, subtopics: result.rows, title: topic.replace('_', ' '), new_posts: results.new_posts, active: results.active, popular: results.popular});
            });
        }
    });
});

app.get('/subforums/:topic/:subtopic', function(req, resp) {
    let topic = fn.capitalize(req.params.topic.replace('_', ' '));
    let subtopic = fn.capitalize(req.params.subtopic.replace('_', ' '));
    let page = req.query.page;

    db.query('SELECT subtopic_status, subtopic_id, topic_title, category FROM subtopics LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE subtopic_title = $1', [subtopic], function(err, result) {
        if (err) {
            console.log(err);
            fn.error(req, resp, 500);
        } else if (result !== undefined && result.rows.length === 1) {
            let status = result.rows[0].subtopic_status;
            let subtopic_id = result.rows[0].subtopic_id;
            let topic_title = result.rows[0].topic_title;
            let category = result.rows[0].category;

            if (page > 1) {
                var limit = (page - 1) * 25;
                var offset = limit;
            } else {
                var limit = 25;
                var offset = 0;
            }

            db.query('SELECT posts.*, SUM(posts.replies) AS total_replies, subtopics.subtopic_title, users.username, users.user_id, users.last_login FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN users ON users.username = posts.post_user WHERE subtopics.subtopic_title = $1 AND reply_to_post_id IS NULL GROUP BY posts.post_id, subtopics.subtopic_title, users.user_id ORDER BY post_created DESC LIMIT $2 OFFSET $3', [subtopic, limit, offset], function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 500);
                } else if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                        result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                    }

                    resp.render('forums/posts', {user: req.session.user, posts: result.rows, status: status, title: subtopic, topic_title: topic_title, subtopic_id: subtopic_id, category: category});
                }
            });
        }
    });
});

app.get('/forums/posts/post-details', function(req, resp) {
    let post_id = req.query.pid;
    let topic_id = req.query.tid;
    let reply_id = req.query.rid;
    let page = req.query.page;

    db.query("SELECT posts.*, topics.topic_title, subtopics.subtopic_title, users.user_id, users.last_login FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON topics.topic_id = subtopics.belongs_to_topic LEFT JOIN users ON posts.post_user = users.username WHERE posts.post_id = $1 AND posts.post_status != 'Removed'", [post_id], function(err, result) {
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
                console.log(page);
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
    });
});

app.get('/edit-post', function(req, resp) {
    let post_id = req.query.pid;

    if (req.session.user) {
        db.query("SELECT * FROM posts JOIN subtopics ON posts.post_topic = subtopics.subtopic_id WHERE post_id = $1 AND post_status != 'Removed'", [post_id], function(err, result) {
            if (err) {
                console.log(err);
                fn.error(req, resp, 500);
            } else if (result !== undefined && result.rows.length === 1) {
                resp.render('blocks/edit-post', {user: req.session.user, post: result.rows[0], title: 'Edit Post'});
            }
        });
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/user-settings', function(req, resp) {
    let test_arr = [1,2,3,4,5,6,7];

    if (req.session.user) {
        let key = req.query.key

        try {
            var decoded = decodeURIComponent(key);
        } catch (e) {
            var decoded = '';
        }

        let decrypted = CryptoJS.AES.decrypt(decoded, process.env.ENC_KEY);

        try {
            var validateKey = decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            var validateKey = '';
        } 

        if (validateKey === req.session.user.username) {
            resp.render('blocks/user-settings', {user: req.session.user, title: 'User Settings'});
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/admin-page/overview', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.query('SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category FROM categories LEFT OUTER JOIN topics ON topics.topic_category = categories.cat_id LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic GROUP BY belongs_to_topic, subtopic_title, topic_title, category ORDER BY category, topic_title, subtopic_title', function(err, result) {
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
            let paramString = '';
            let offset = req.query.offset;
            let params = [offset];
            let username = req.query.username;

            if (req.query) {
                let i = 2;
                for (let key in req.query) {
                    if (key === 'offset') {
                        offset = req.query.offset;
                    } else {
                        let newString = ' AND ' + key + ' = $' + i;
                        paramString += newString;
                        params.push(req.query[key]);
                        i++;
                    }
                }
            }

            let queryString = 'SELECT user_id, username, email, last_login, privilege, user_level, user_status, receive_email, show_online, avatar_url, user_created, user_confirmed FROM users WHERE user_id != 1' + paramString + ' ORDER BY username OFFSET $1 LIMIT 20';

            db.query(queryString, params, function(err, result) {
                if (err) { console.log(err); }

                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].user_created = moment(result.rows[i].user_created).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[i].user_confirmed = moment(result.rows[i].user_confirmed).format('MM/DD/YYYY @ hh:mm:ss A');
                        result.rows[i].last_login = moment(result.rows[i].last_login).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    resp.render('blocks/admin-users', {user: req.session.user, page: 'users', users: result.rows, title: 'Admin Users'});
                }
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
            db.query('SELECT post_id, post_title, post_user, post_created, post_status, post_body FROM posts ORDER BY post_id', function(err, result) {
                if (err) { console.log(err); }

                if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].post_created = moment(result.rows[i].post_created).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    resp.render('blocks/admin-posts', {user: req.session.user, page: 'posts', posts: result.rows, title: 'Admin Posts'});
                } else {
                    fn.error(req, resp, 500);
                }
            })
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
            db.query('SELECT * FROM categories', function(err, result) {
                if (err) {
                    console.log(err);
                    fn.error(req, resp, 500);
                } else if (result !== undefined) {
                    for (let i in result.rows) {
                        result.rows[i].cat_created_on = moment(result.rows[i].cat_created_on).format('MM/DD/YYYY @ hh:mm:ss A');
                    }

                    resp.render('blocks/admin-categories', {user: req.session.user, page: 'categories', categories: result.rows, title: 'Admin Categories'});
                }
            })
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/admin-page/topics', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            resp.render('blocks/admin-topics', {user: req.session.user, page: 'topics', title: 'Admin Topics'});
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 401);
    }
});

app.get('/admin-page/config', function(req, resp) {
    if (req.session.user) {
        if (req.session.user.privilege > 1) {
            db.query('SELECT * FROM config ORDER BY config_id', function(err, result) {
                if (err) { console.log(err); }

                resp.render('blocks/admin-config', {user: req.session.user, page: 'config', config: result.rows, title: 'Admin Config'});
            });
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
            let postId = req.query.pid;

            db.query('SELECT * FROM posts WHERE post_id = $1', [postId], function(err, result) {
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
            })
        } else {
            fn.error(req, resp, 401);
        }
    } else {
        fn.error(req, resp, 401);
    }
})

app.get('/logout', function(req, resp) {
    req.session = null;

    resp.redirect(req.get('referer'));
});

module.exports = app;