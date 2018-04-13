var fs = require('fs');
var http = require('http');

var express = require('express');
var app = express();

var httpServer = http.createServer(app);

httpServer.listen(8080);

app.get('/', function(req, res) {
  res.header('Content-type', 'text/html');
  return res.end('<h1>Hello, Secure World!</h1>');
});

app.post('/upload', function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'multipart/form-data' });
  res.json({ message: 'File uploaded successfully' });
  res.write(req.url);
});
