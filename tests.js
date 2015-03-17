var chai = require('chai'),
supertest = require('supertest'),
version = require('./lib'),
expect = chai.expect
;

describe('express-route-versioning', function() {
  it('should export Version constructor directly from package', function() {
    expect(version).to.be.an.object;
  });

  describe('express re-route', function() {
    var express = require('express'),
    one = express.Router(),
    two = express.Router(),
    three = express.Router(),
    app = express()
    ;

    one.all('/example', function(req, res, next) { return res.send('one') ;});
    two.get('/example', function(req, res, next) { return res.send('two') ;});

    version.use({
      'header': 'accept',
      'catcher': /vnd.mycompany.com\+json; version=(\d+)(,|$)/,
      'error': 406,
    });
    app.use(version.reroute({1: one, 2: two, 3: three}));

    it('should match exact version', function(done) {
      supertest(app)
      .get('/example')
      .set('accept', '/vnd.mycompany.com+json; version=1')
      .expect(function(res) {
        expect(res.text).to.equal('one');
      })
      .end(done);
    });

    it('should match highest version', function(done) {
      supertest(app)
      .get('/example')
      .set('accept', '/vnd.mycompany.com+json; version=2')
      .expect(function(res) {
        expect(res.text).to.equal('two');
      })
      .end(done);
    });

    it('should match http verb', function(done) {
      supertest(app)
      .put('/example')
      .set('accept', '/vnd.mycompany.com+json; version=2')
      .expect(function(res) {
        expect(res.text).to.equal('one');
      })
      .end(done);
    });

    it('should handle all http verbs', function(done) {
      supertest(app)
      .post('/example')
      .set('accept', '/vnd.mycompany.com+json; version=2')
      .expect(function(res) {
        expect(res.text).to.equal('one');
      })
      .end(done);
    });

    it('should expose older routes', function(done) {
      supertest(app)
      .get('/example')
      .set('accept', '/vnd.mycompany.com+json; version=3')
      .expect(function(res) {
        expect(res.text).to.equal('two');
      })
      .end(done);
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if no version match', function(done) {
      supertest(app)
      .get('/example')
      .set('accept', 'vnd.mycompany.com+json; version=0')
      .expect(406)
      .end(done);
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if missing version in header', function(done) {
      supertest(app)
      .get('/example')
      .set('accept', 'vnd.mycompany.com+json')
      .expect(406)
      .end(done);
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if missing header', function(done) {
      supertest(app)
      .get('/example')
      .expect(406)
      .end(done);
    });
  });
});
