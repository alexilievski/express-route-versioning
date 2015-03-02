var Version = function() {};

/**
 * Specify options for `Version`
 *
 * Options:
 *  - `header` is the HTTP header name that holds the version number
 *  - `grab` is a regexp capture group for catching the version number
 *  - `error` is a HTTP status code that is returned if no re-route is possible
 *
 *  @param {Object} options
 */
Version.prototype.use = function(options) {
  this._header = options.header.toLowerCase() || 'accept';
  this._grab = options.grab || /vnd.mycompany.com\+json; version=(\d+)(,|$)/;
  this._error = options.error || 406;
};

var has_routing_path = function (router, path) {
  return router.stack.some(function(route) {
    return route.regexp.test(path);
  });
};

/**
 * Re-route to middleware based on version
 *
 * Examples:
 *   `version.reroute({1: foo, 2: bar})`
 *   Will reroute to the function `foo` if the version is 1
 *
 * `reroute_map` is a mapper on the format {`version`: `route_handler`} where:
 *   - `version` is a numeric version number
 *   - `route_handler` follows the Connect middleware format `function(req, res, next)`
 *
 * @param {Object} reroute_map
 */
Version.prototype.reroute = function(reroute_map) {
  var header = this._header;
  var grab = this._grab;
  var error = this._error;
  return function(req, res, next) {
    var header_value = req.headers[header];
    var match = grab.exec(header_value);
    if (match) {
      var versions = Object.keys(reroute_map).reverse();
      for (var i=0; i<versions.length; i++) {
        var version = Number(versions[i]);
        if (match[1] >= version) {
          var router = reroute_map[version];
          if (has_routing_path(router, req.path)) {
            return router(req, res, next);
          }
        }
      }
    }
    return res.status(error).end();
  };
};

exports = module.exports = new Version();
