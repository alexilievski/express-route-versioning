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
    subRouter = express.Router()
    ;

    subRouter.get('/sub-route', function(req, res, next) { return res.send('sub-route') ;});
    one.all('/example', function(req, res, next) { return res.send('one') ;});
    two.get('/example', function(req, res, next) { return res.send('two') ;});

    two.use('/base-route', subRouter);

    version.use({
      'header': 'accept',
      'catcher': /vnd.mycompany.com\+json; version=(\d+)(,|$)/,
      'error': 406,
    });

    describe('normal cases', function() {
      var app = express();
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

      it('should work with sub routers', function(done) {
        supertest(app)
          .get('/base-route/sub-route')
          .set('accept', '/vnd.mycompany.com+json; version=2')
          .expect(200)
          .expect(function(res) {
            expect(res.text).to.equal('sub-route');
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

      it('should return 404 (HTTP status code NOT FOUND) if a route is not defined in any version', function(done) {
        supertest(app)
          .get('/anyRouteThatDoesntExist')
          .set('accept', 'vnd.mycompany.com+json; version=1')
          .expect(404)
          .end(done);
      });
    });

    describe('weird cases', function() {
      var
          four = express.Router(),
          app = express()
          ;

      four.get('/example', function(req, res, next) { return res.send('four') ;});
      four.stack[0].route = undefined;
      app.use(version.reroute({1: one, 2: two, 3: three, 4: four}));

      it('should handle layer with undefined route', function(done) {
        supertest(app)
        .get('/example')
        .set('accept', '/vnd.mycompany.com+json; version=4')
        .expect(function(res) {
          expect(res.text).to.equal('two');
        })
        .end(done);
      });
    });
  });
});
