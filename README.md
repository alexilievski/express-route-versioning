#express-route-versioning
A [Connect](https://github.com/senchalabs/connect) style middleware to re-direct the execution flow into multiple branches based on HTTP header values. Tested and used for REST API versioning with [Express](https://github.com/strongloop/express) routes but other applications might be suiting.

##Features
Customize the extraction of the version via `version.use(options)` for:
* any HTTP header using `header`, i.e. `version.use({header: 'Accept-Version'})`
* any HTTP header value using RegEx capture groups in `grab`, i.e. `version.use({grab: /vnd.my.company.()})`

Customize the HTTP status code for a failed re-routing using the `error`, i.e. `version.use({error: 404})`

##Example
Re-route based on version in HTTP header `Accept: vnd.mycompany.com+json; version=1`.
```javascript
var express = require('express');
    version = require('express-version-reroute');
version.use({
    'header': 'accept',
    'grab': /vnd.mycompany.com\+json; version=(\d+)(,|$)/,
    'error': 406,
});
var router = express.Router()
  .all('/ping',
       version.reroute({
         1: function(req, res, next) { res.json('pong'); },
         2: function(req, res, next) { res.status(200).end(); },
       })
   );
express().use(router).listen(5000, function() {});
```
[cURL](http://curl.haxx.se/) examples that give different behavior based on version.
```
➜  ~  curl -i -X GET 'http://127.0.0.1:5000/ping' -H 'Accept: vnd.mycompany.com+json; version=2'
HTTP/1.1 200 OK
X-Powered-By: Express
Date: Wed, 05 Nov 2014 10:09:50 GMT
Connection: keep-alive
Transfer-Encoding: chunked

➜  ~  curl -i -X GET 'http://127.0.0.1:5000/ping' -H 'Accept: vnd.mycompany.com+json; version=1'
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 6
ETag: W/"6-dca458aa"
Date: Wed, 05 Nov 2014 10:09:56 GMT
Connection: keep-alive

"pong"%
➜  ~  curl -i -X GET 'http://127.0.0.1:5000/ping' -H 'Accept: vnd.mycompany.com+json; version=0'
HTTP/1.1 406 Not Acceptable
X-Powered-By: Express
Date: Wed, 05 Nov 2014 10:09:58 GMT
Connection: keep-alive
Transfer-Encoding: chunked
```

## Development
```
npm install
npm test
```
