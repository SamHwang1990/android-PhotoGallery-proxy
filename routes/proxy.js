var express = require('express');
var router = express.Router();
var URI = require('urijs');
var config = require('../config.json');

var API_KEY = config.API_KEY;
var REST_URL = 'https://api.flickr.com/services/rest';

var restUriBuilder = new URI(REST_URL);
restUriBuilder.search({
  'api_key': API_KEY,
  'format': 'json',
  'nojsoncallback': '1',
  'extras': 'url_s'
});

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('welcome to flickr proxy');
});

router.get('/photos/getRecent/:page', function(req, res, next) {
  var params = req.params;
  var page = params.page;

  var url = restUriBuilder.addQuery({
    method: ['flickr', 'photos', 'getRecent' ].join('.'),
    page: page || 1
  }).toString();

  var chunks = [];
  var size = 0;
  invokeProxy(url, function(response) {
    response.on('data', function(chunk) {
      chunks.push(chunk);
      size += chunk.length;
    }).on('end', function() {
      var buf = Buffer.concat(chunks, size);
      var str = iconv.decode(buf, 'utf-8');
      res.send(str);
    });
  });
});

router.get('/photos/fetchUrl', function(req, res, next) {
  var query = req.query;

  invokeProxy(query.uri, function(response) {
    var idx = 0;
    var len = parseInt(response.headers['content-length']);
    var body = new Buffer(len);

    response.setEncoding('binary');

    response.on('data', function(chunk) {
      body.write(chunk, idx, "binary");
      idx += chunk.length;
    }).on('end', function() {
      res.type(response.headers['content-type']);
      res.send(body);
    });
  });
});

function invokeProxy(uri, getCallback) {
  var shttp = require('socks5-https-client');
  shttp.get(uri, getCallback)
}

module.exports = router;
