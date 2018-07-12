const db = require('../db');
const moment = require('moment');
const CryptoJS = require('crypto-js');

module.exports = {
    capitalize: function(string) {
        let strings = string.split(' ');
        let newString = [];

        for (let string of strings) {
            let capitalized = string.charAt(0).toUpperCase() + string.slice(1);
            newString.push(capitalized);
        }

        return newString.toString().replace(/,/g, ' ');
    },
    newActivePopular: function(moreWhereClause, show, callback) {
        db.connect(async function(err, client, done) {
            if (err) { console.log(err); }
            
            let popular = await client.query("SELECT * FROM (SELECT subtopic_title, user_id, user_status, post_id, post_title, post_topic, post_created, post_upvote, post_downvote, (post_upvote + post_downvote) AS votes, SUM(replies) AS total_replies, post_user, last_login, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + " GROUP BY subtopics.subtopic_title, users.user_id, posts.post_id, topics.topic_title) AS vote_table ORDER BY votes DESC, CASE WHEN votes = 0 THEN post_created END DESC LIMIT $1", [show])
            .then((result) => {
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
            });

            let newPosts = await client.query("SELECT post_id, post_title, subtopic_title, user_id, user_status, post_topic, post_created, post_upvote, post_downvote, SUM(replies) AS total_replies, post_user, last_login, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + " GROUP BY subtopics.subtopic_title, posts.post_id, users.user_id, topics.topic_title ORDER BY post_created DESC LIMIT $1", [show])
            .then((result) => {
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
            });

            let mostActive = await client.query("SELECT * FROM (SELECT subtopic_title, user_id, user_status, post_id, post_title, post_topic, post_created, post_upvote, post_downvote, SUM(replies) AS total_replies, last_login, post_user, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + "  GROUP BY subtopics.subtopic_title, users.user_id, posts.post_id, topics.topic_title) AS vote_table ORDER BY total_replies DESC, CASE WHEN total_replies = 0 THEN post_created END DESC LIMIT $1", [show])
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
            });

            let results = {popular: popular, new_posts: newPosts, active: mostActive}
            callback(results);
        });
        /* db.query("SELECT * FROM (SELECT subtopic_title, user_id, user_status, post_id, post_title, post_topic, post_created, post_upvote, post_downvote, (post_upvote + post_downvote) AS votes, SUM(replies) AS total_replies, post_user, last_login, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + " GROUP BY subtopics.subtopic_title, users.user_id, posts.post_id, topics.topic_title) AS vote_table ORDER BY votes DESC, CASE WHEN votes = 0 THEN post_created END DESC LIMIT $1", [show], function(err, result) {
            if (err) { console.log(err); }
    
            if (result !== undefined) {
                for (let i in result.rows) {
                    result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                    result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                }
    
                let popular = result.rows;
    
                db.query("SELECT post_id, post_title, subtopic_title, user_id, user_status, post_topic, post_created, post_upvote, post_downvote, SUM(replies) AS total_replies, post_user, last_login, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + " GROUP BY subtopics.subtopic_title, posts.post_id, users.user_id, topics.topic_title ORDER BY post_created DESC LIMIT $1", [show], function(err, result) {
                    if (err) { console.log(err); }
    
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                            result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                        }
    
                        let newPosts = result.rows;
    
                        db.query("SELECT * FROM (SELECT subtopic_title, user_id, user_status, post_id, post_title, post_topic, post_created, post_upvote, post_downvote, SUM(replies) AS total_replies, last_login, post_user, topic_title FROM posts LEFT JOIN subtopics ON posts.post_topic = subtopics.subtopic_id LEFT JOIN topics ON subtopics.belongs_to_topic = topics.topic_id LEFT JOIN users ON users.username = posts.post_user LEFT JOIN categories ON categories.cat_id = topics.topic_category WHERE post_status != 'Removed' AND reply_to_post_id IS NULL" + moreWhereClause + "  GROUP BY subtopics.subtopic_title, users.user_id, posts.post_id, topics.topic_title) AS vote_table ORDER BY total_replies DESC, CASE WHEN total_replies = 0 THEN post_created END DESC LIMIT $1", [show], function(err, result) {
                            if (err) { console.log(err); }
    
                            if (result !== undefined) {
                                for (let i in result.rows) {
                                    result.rows[i].post_created = moment(result.rows[i].post_created).fromNow();
                                    result.rows[i].last_login = moment(result.rows[i].last_login).fromNow();
                                }
    
                                let mostActive = result.rows;
                                let results = {popular: popular, new_posts: newPosts, active: mostActive}
                                callback(results);
                            }
                        });
                    }
                });
            }
        }); */
    },
    /** Error Handling - Redirects the user to an error page displaying the error
     * @param {Number} code - 400 Bad Request
     * - 401 Unauthorized
     * - 403 Forbidden
     * - 406 Not Acceptable
     * - 413 Payload Too Large
     * - 500 Internal Server Error
    */
    error: function(req, resp, code, message) {
        let customMessage = '';

        if (code === 500) {
            customMessage = 'An error occurred while trying to access this page.';
        } else if (code === 401) {
            customMessage = 'You\'re not authorized to perform this action.';
        } else if (code == 400) {
            customMessage = 'An error occurred while processing the data.';
        } else if (code === 403) {
            customMessage = 'You don\'t have permission to access this page.';
        } else if (code === 404) {
            customMessage = 'The requested content is not found.';
        } else if (code == 413) {
            customMessage = 'The data being processed is too large.';
        } else if (code === 406) {
            customMessage = 'The data being processed by this action is not allowed.';
        }

        if (message) {
            customMessage = message;
        }

        return resp.render('blocks/response', {user: req.session.user, status: 'Error ' + code, message: customMessage});
    },
    validateKey: function(req) {
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

        return validateKey;
    }
}