// modules
const express = require('express');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
const session = require('cookie-session');
const db = require('./routers/db');
const $ = require('jquery');

// server configurations
const port = process.env.PORT;
const app = express();
const server = require('http').createServer(app);

// body parser initialization
app.use(bodyParser.urlencoded({
    extended: true
}));

// cookie-session configurations
app.use(session({
    secret: process.env.SESSION_SECRET,
    maxAge: 1.8e+6
}));

app.use(function (req, res, next) {
    req.session.nowInMinutes = Math.floor(Date.now() / 60e3)
    next();
});

// static routes
const staticRoutes = require('./routers/static');
app.use(staticRoutes);

// routers
const routers = require('./routers/routes');
app.use(routers);

// authentication
const auth = require('./routers/auth');
app.use(auth);

// get data
const getData = require('./routers/get-data');
app.use(getData);

// posts handler
const posts = require('./routers/posts');
app.use(posts);

// users profile
const users = require('./routers/users');
app.use(users);

// admin configurations
const adminPanel = require('./routers/admin');
app.use(adminPanel);

// forums
const forums = require('./routers/forums');
app.use(forums);

// message controller
const message = require('./routers/messages');
app.use(message);

// setting view engine to use pug
app.set('view engine', 'pug');
app.set('views', ['templates', 'templates/inc', 'templates/blocks']);

// server initialization
server.listen(port, function(err) {
    if (err) {
        console.log(err);
        return false;
    }

    console.log('Server running on port ' + port);
    console.log(process.env.NODE_ENV);
});


module.exports = app;