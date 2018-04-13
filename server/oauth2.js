const bodyParser = require('body-parser');
const multer = require('multer');
const finalhandler = require('finalhandler');
const http = require('http');
const Router = require('router');
const multerGD = require('./index.js');

let router = Router();

var upload = multer({
  storage: multerGD(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post('/upload', upload.single('file'), (req, res) => {
  console.log(res.status);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(200, { 'Content-Type': 'multipart/form-data' });
  res.json({ message: 'File uploaded successfully' });
  res.write(req.url);
});

http
  .createServer(function(req, res) {
    router(req, res, finalhandler(req, res));
  })
  .listen(8080);

module.exports = router;
