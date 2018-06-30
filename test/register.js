const request = require('supertest');
const http = require('http');
const assert = require('assert');
const Browser = require('zombie');
const app = require('../index');
const rs = require('randomstring');

describe('register form', function(done) {
    before(function() {
        this.server = http.createServer(app).listen(3000);
        this.browser = new Browser({ site: 'http://localhost:3000' });
    });

    describe('successful registration', function(done) {
        before(function(done) {
            this.browser.visit('/register', done);
        });

        before(function() {
            let username = rs.generate(7);

            this.browser.fill('#register-form input[name=username]', username);
            this.browser.fill('#register-form input[name=password]', 111111);
            this.browser.fill('#register-form input[name=confirm_password]', 111111);
            this.browser.fill('#register-form input[name=email]', username + '@test.com');
            this.browser.fill('#register-form input[name=confirm_email]', username + '@test.com');
            this.browser.check('#register-form input[name=agreement]');
            return this.browser.pressButton('Submit', done);
        });

        it('should show a success page', function(done) {
            this.browser.assert.url({ pathname: '/registration' });
            this.browser.assert.text('.message', 'Registration successful.');
            done();
        });
    });

    describe('invalid username format', function(done) {
        before(function(done) {
            this.browser.visit('/register', done);
        });

        before(function() {
            let username = rs.generate(7);

            this.browser.fill('#register-form input[name=username]', username + '*');
            this.browser.fill('#register-form input[name=password]', 111111);
            this.browser.fill('#register-form input[name=confirm_password]', 111111);
            this.browser.fill('#register-form input[name=email]', username + '@test.com');
            this.browser.fill('#register-form input[name=confirm_email]', username + '@test.com');
            this.browser.check('#register-form input[name=agreement]');
            return this.browser.pressButton('Submit', done);
        });

        it('should show a invalid format error page', function(done) {
            this.browser.assert.url({ pathname: '/registration' });
            this.browser.assert.text('.message', 'One or more credentials contains invalid format.');
            done();
        });
    });

    describe('password does not match', function(done) {
        before(function(done) {
            this.browser.visit('/register', done);
        });

        before(function() {
            let username = rs.generate(7);

            this.browser.fill('#register-form input[name=username]', username);
            this.browser.fill('#register-form input[name=password]', 111111);
            this.browser.fill('#register-form input[name=confirm_password]', 111112);
            this.browser.fill('#register-form input[name=email]', username + '@test.com');
            this.browser.fill('#register-form input[name=confirm_email]', username + '@test.com');
            this.browser.check('#register-form input[name=agreement]');
            return this.browser.pressButton('Submit', done);
        });

        it('should show a password mismatch error page', function(done) {
            this.browser.assert.url({ pathname: '/registration' });
            this.browser.assert.text('.message', 'Your password or email do not match.');
            done();
        });
    });

    describe('password does not match', function(done) {
        before(function(done) {
            this.browser.visit('/register', done);
        });

        before(function() {
            let username = rs.generate(7);

            this.browser.fill('#register-form input[name=username]', username);
            this.browser.fill('#register-form input[name=password]', 111111);
            this.browser.fill('#register-form input[name=confirm_password]', 111111);
            this.browser.fill('#register-form input[name=email]', username + '@test.com');
            this.browser.fill('#register-form input[name=confirm_email]', username + '@test2.com');
            this.browser.check('#register-form input[name=agreement]');
            return this.browser.pressButton('Submit', done);
        });

        it('should show a email mismatch error page', function(done) {
            this.browser.assert.url({ pathname: '/registration' });
            this.browser.assert.text('.message', 'Your password or email do not match.');
            done();
        });
    });

    describe('did not agree to TOS', function(done) {
        before(function(done) {
            this.browser.visit('/register', done);
        });
        
        before(function() {
            let username = rs.generate(7);

            this.browser.fill('#register-form input[name=username]', username);
            this.browser.fill('#register-form input[name=password]', 111111);
            this.browser.fill('#register-form input[name=confirm_password]', 111111);
            this.browser.fill('#register-form input[name=email]', username + '@test.com');
            this.browser.fill('#register-form input[name=confirm_email]', username + '@test2.com');
            return this.browser.pressButton('Submit', done);
        });

        it('should show agreement was not check page', function(done) {
            this.browser.assert.url({ pathname: '/registration' });
            this.browser.assert.text('.message', 'You must read and accept the terms of service.');
            done();
        });
    });
});