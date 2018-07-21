const app = require('express').Router();
const db = require('./db');
const moment = require('moment');
const fn = require('./utils/functions');

app.get('/get-forum-sidebar', function(req, resp) {
    db.connect(async function(err, client, done) {
        if (err) { console.log(err); }

        let forumSidebar = await client.query("SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category FROM categories LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic GROUP BY belongs_to_topic, subtopic_title, topic_title, category ORDER BY category, topic_title LIKE '%General' DESC, topic_title, subtopic_title")
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
    /* db.query("SELECT subtopic_title, COUNT(post_id) AS post_count, belongs_to_topic, topic_title, category FROM categories LEFT OUTER JOIN topics ON topics.topic_category = categories.category_id LEFT OUTER JOIN subtopics ON subtopics.belongs_to_topic = topics.topic_id LEFT OUTER JOIN posts ON subtopics.subtopic_id = posts.post_topic GROUP BY belongs_to_topic, subtopic_title, topic_title, category ORDER BY category, topic_title LIKE '%General' DESC, topic_title, subtopic_title", function(err, result) {
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

            resp.send({status: 'success', menu: category});
        }
    }); */
});

module.exports = app;