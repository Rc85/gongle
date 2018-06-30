const request = require('supertest');
const http = require('http');
const assert = require('assert');
const Browser = require('zombie');
const app = require('../index');

describe('home page', function() {
    before(function() {
        this.server = http.createServer(app).listen(3000);
        this.browser = new Browser({ site: 'http://localhost:3000' });
    });

    before(function(done) {
        this.browser.visit('/', done);
    });

    it('show HealMe title', function(done) {
        this.browser.assert.success();
        this.browser.assert.text('.title h1', 'HEALME');
        done();
    });

    after(function(done) {
        this.server.close(done);
    });
});