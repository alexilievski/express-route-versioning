var chai = require('chai'),
    version = require('./lib');

var expect = chai.expect;

function bar(req, res, next) { return 'bar'; }
function baz(req, res, next) { return 'baz'; }
function foo(req, res, next) { return 'foo'; }

describe('express-route-versioning', function() {

  it('should export Version constructor directly from package', function() {
    expect(version).to.be.an.object;
  });

  describe('re-route', function() {
    version.use({
      'header': 'accept',
      'catcher': /vnd.mycompany.com\+json; version=(\d+)(,|$)/,
      'error': 406,
    });
    var reroute = version.reroute({1: foo, 2: bar, 3: baz});

    it('should match highest version', function() {
      var req = {headers: {accept: 'vnd.mycompany.com+json; version=2'}};
      expect(reroute(req, null, null)).to.equal('bar');
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if no version match', function() {
      var req = {headers: {accept: 'vnd.mycompany.com+json; version=0'}};
      var res = {status: function(code) { return {end: function() {return code;}};}};
      expect(reroute(req, res, null)).to.equal(406);
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if missing version in header', function() {
      var req = {headers: {accept: 'vnd.mycompany.com+json'}};
      var res = {status: function(code) { return {end: function() {return code;}};}};
      expect(reroute(req, res, null)).to.equal(406);
    });

    it('should return 406 (HTTP status code NOT ACCEPTABLE) if missing header', function() {
      var req = {headers: {}};
      var res = {status: function(code) { return {end: function() {return code;}};}};
      expect(reroute(req, res, null)).to.equal(406);
    });
  });
});
