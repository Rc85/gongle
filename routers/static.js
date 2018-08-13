const express = require('express');
const app = express();

app.use('/css', express.static('css'));
app.use('/scripts', express.static('scripts'));
app.use('/inc', express.static('inc'));
app.use('/images', express.static('images'));
app.use('/files', express.static('user_files'));
app.use('/fonts', express.static('fonts'));

module.exports = app;