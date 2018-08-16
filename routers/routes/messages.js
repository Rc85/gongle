const app = require('express').Router();
const db = require('../db');
const moment = require('moment-timezone');
const fn = require('../utils/functions');

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

            // For security sake, we validate the session key to make sure it belongs to the logged in user
            if (validatedKey === req.session.user.username) {
                let outbox = [];
                let inbox = [];
                let deletedMessagesArray = [];

                // Let's get all the messages that were deleted by the logged in user and store them in an array
                // NOTE: There is a table that logs all deleted messages by a user
                await client.query('SELECT deleted_msg FROM deleted_messages WHERE msg_deleted_by = $1', [req.session.user.username])
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
                deletedMessagesIds = deletedMessagesArray.join(','); // We'll convert the deleted messages into a string separated by commas to use in our WHERE clause later

                if (deletedMessagesArray.length > 0) { // If there are delete messages, add the condition to our WHERE clause
                    deletedMessagesQuery = 'SELECT * FROM messages WHERE (sender = $1 OR recipient = $1) AND message_id NOT IN (' + deletedMessagesIds + ') ORDER BY message_date DESC';
                } else { // Else just get all the messages that is either sent or received by the logged in user
                    deletedMessagesQuery = 'SELECT * FROM messages WHERE sender = $1 OR recipient = $1 ORDER BY message_date DESC';
                }

                // Declare a variable with the executed query result that we will use later
                let allMessages = await client.query(deletedMessagesQuery, [req.session.user.username])
                .then((result) => {
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].message_date = moment(result.rows[i].message_date).format('MM/DD/YYYY @ hh:mm:ss A') // Change the date format

                            if (result.rows[i].sender === req.session.user.username) {
                                outbox.push(result.rows[i]); // If the logged in user is the sender of the message, store them in the outbox array
                            } else {
                                inbox.push(result.rows[i]); // Else if they're the recipient store them in the inbox array
                                // We have successful sorted which message was sent and which message was received
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

                let messages;

                // Execute a query to get all the saved messages by joining the saved message table with the messages table.
                // NOTE: There is a table that logs all saved messages by a user
                let starredMessages = await client.query(`SELECT
                messages.sender, messages.recipient, messages.subject, messages.message,
                messages.message_status, saved_messages.msg_saved_on AS message_date,
                saved_messages.msg_saved_by, saved_messages.saved_msg AS message_id
                FROM saved_messages
                LEFT JOIN messages ON saved_msg = messages.message_id
                WHERE msg_saved_by = $1`, [req.session.user.username])
                .then((result) => {
                    done();
                    if (result !== undefined) {
                        for (let i in result.rows) {
                            result.rows[i].message_date = moment(result.rows[i].message_date).format('MM/DD/YYYY @ hh:mm:ss A');
                            starredIdArray.push(result.rows[i].message_id);
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

                if (req.params.location === 'inbox') { // If the GET request is from inbox, declare messages as the inbox array
                    messages = inbox;
                } else if (req.params.location === 'outbox') { // You get the drift
                    messages = outbox;
                } else if (req.params.location === 'saved') {
                    messages = starredMessages;
                }

                if (req.params.location !== 'content') { // If the GET request is from anything but content (that being inbox, outbox, or saved), then render the messages template
                    resp.render('blocks/messages', {user: req.session.user, messages: messages, saved_messages: starredIdArray, title: 'Messages', location: req.params.location});
                } else { // Else if it's from content
                    let message;
                    let messageId = parseInt(req.query.id);
                    if (req.query.location === 'inbox') { // And if there is a query of inbox
                        // Get the recipient of the message
                        let recipient = await client.query('SELECT recipient FROM messages WHERE message_id = $1', [req.query.id])
                        .then(result => {
                            if (result !== undefined) {
                                return result.rows[0].recipient;
                            }
                        })
                        .catch(err => {
                            console.log(err);
                            done();
                        });

                        // For security sake, we make sure the recipient of the message belongs to the logged in user
                        if (req.session.user.username === recipient) {
                            // Mark message as 'Read'
                            await client.query("UPDATE messages SET message_status = 'Read' WHERE message_id = $1", [req.query.id])
                            .catch((err) => {
                                console.log(err);
                                done();
                            });
                        } else {
                            fn.error(req, resp, 403);
                        }
                    }

                    // Remember the query we executed and saved in allMessage? Loop through it and get the message
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
    } else {
        fn.error(req, resp, 403);
    }
});

app.get('/message/compose', function(req, resp) {
    if (req.session.user) {
        resp.render('blocks/message', {user: req.session.user, title: 'Compose Message', location: 'compose'});
    } else {
        fn.error(req, resp, 403);
    }
});

module.exports = app;