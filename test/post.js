const request = require('supertest');
const http = require('http');
const assert = require('assert');
const Browser = require('zombie');
const app = require('../index');
const rs = require('randomstring');

describe('post', function() {
    before(function() {
        this.server = http.createServer(app).listen(3000);
        this.browser = new Browser({ site: 'http://localhost:3000' });
    });

    describe('login', function(done) {
        before(function(done) {
            this.browser.visit('/', done);
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

    describe('navigate', function(done) {
        before(function(done) {
            this.browser.visit('/', done);
        });

        it('should go to a subtopic', function(done) {
            this.browser.click('#sub-topics-menu-1 a:first-child');
            this.browser.assert.url({ pathname: '/subtopics/1' });
            done();
        });
    });

    describe('post form', function(done) {
        before(function(done) {
            this.browser.visit(this.browser.location.href, done);
        });

        describe('press new post button', function(done) {
            before(function(done) {
                return this.browser.pressButton('NEW POST', done);
            });

            it('should hide new post form', function(done) {
                this.browser.assert.style('#post-form', 'display', 'none');
                done();
            });
        });

        describe('press "new post" button again', function(done) {
            before(function(done) {
                return this.browser.pressButton('NEW POST', done);
            });
    
            it('should show new post form', function(done) {
                this.browser.assert.style('#post-form', 'display', '');
                done();
            });
        });
    });

    describe('create post', function(done) {
        before(function(done) {
            let title = rs.generate();
            this.browser.fill('#post-form input[name=title]', title);
            this.browser.fill('#post-form textarea', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Odio sunt omnis excepturi expedita et numquam accusantium culpa, nostrum facere assumenda dicta dolore? Dolorem, quasi. Non, laudantium asperiores! Molestiae, ad facilis.');
            return this.browser.pressButton('Submit', done)
        });

        it('should go to success page', function(done) {
            this.browser.assert.text('.message', 'Post successfully created.');
            done();
        });
    });

    /* describe('post reply', function() {
        before(function(done) {
            try {
                this.browser.visit('http://localhost:3000/post-details?pid=9&tid=1&page=1&s=0');
            } catch (e) {
                throw e;  
            } finally {
                return this.browser.pressButton('Reply', done);
            }
        });

        before(function(done) {
            this.browser.fill('#reply-post-form textarea[name=post_body]', 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem alias animi exercitationem cum aut ex? Iusto, accusantium. Placeat, tenetur inventore. Suscipit quam voluptates incidunt voluptatum. Qui similique inventore cum id.');
            return this.browser.pressButton('Submit', done);
        })
        
        it('should see a success page', function(done) {
            this.browser.assert('.message', 'Post successfully created.');
            done();
        });
    }); */

    after(function(done) {
        this.server.close(done);
    });
});