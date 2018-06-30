const request = require('supertest');
const http = require('http');
const assert = require('assert');
const Browser = require('zombie');
const app = require('../index');

describe('login', function() {
    before(function() {
        this.server = http.createServer(app).listen(3000);
        this.browser = new Browser({ site: 'http://localhost:3000' });
    });

    describe('login form', function(done) {
        describe('unsuccessful logn', function(done) {
            before(function(done) {
                this.browser.visit('/', done);
            });
            
            before(function() {
                this.browser.resources[0].request.headers['Referer'] = 'http://localhost:3000';
                this.browser.fill('#login-form input[name=email]', 'rogerchin85@gmail.com');
                this.browser.fill('#login-form input[name=password]', 222222);
                return this.browser.pressButton('Login', done);
            });
    
            it('should redirect to login error page', function(done) {
                this.browser.assert.url({ pathname: '/login' });
                this.browser.assert.text('.message', 'The email or password is incorrect.');
                done();
            });
        });
        
        describe('successful login', function(done) {
            before(function(done) {
                this.browser.visit('/', done);
            });

            before(function() {
                this.browser.fill('#login-form input[name=email]', 'rogerchin85@gmail.com');
                this.browser.fill('#login-form input[name=password]', 111111);
                return this.browser.pressButton('Login', done);
            });
    
            it('should login', function(done) {
                this.browser.assert.text('.username-profile-link', 'rogerchin85');
                done();
            });
        });
    });

    after(function(done) {
        this.server.close(done);
    });
});