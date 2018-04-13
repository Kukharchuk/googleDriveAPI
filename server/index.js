const readline = require('readline');
const { google } = require('googleapis');
const OAuth2Client = google.auth.OAuth2;
const fs = require('fs');
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
];
const TOKEN_PATH = 'credentials.json';
const uuid = require('uuid');
const os = require('os');

Promise = require('bluebird');

function DriveStorage(opts, preproc) {
  fs.readFile('client_secret.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    authorize(JSON.parse(content));
  });
  function authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new OAuth2Client(
      client_id,
      client_secret,
      redirect_uris[0],
    );
    google.options({ auth: oAuth2Client });
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client);
      oAuth2Client.setCredentials(JSON.parse(token));
    });
  }

  function getAccessToken(oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', code => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return callback(err);
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
      });
    });
  }
  this.drive = google.drive({ version: 'v3' });
  this.preproc = preproc;
}

DriveStorage.prototype._handleFile = function(req, file, cb) {
  let stream = file.stream;
  let self = this;
  if (typeof this.preproc === 'function') {
    stream = this.preproc(stream);
  } else {
    stream = new Promise(function(resolve) {
      return resolve(stream);
    });
  }
  stream
    .then(function(_stream) {
      self.drive.files.create(
        {
          resource: {
            name: file.originalname,
            mimeType: file.mimetype,
          },
          media: {
            mimeType: file.mimetype,
            body: _stream,
          },
        },
        function(err, response) {
          if (err) {
            console.log(err);
            return cb(err, null);
          }
          console.log(response.id);
          return cb(err, {
            googleId: response.id,
          });
        },
      );
    })
    .then(file => {
      console.log(file);
    })
    .catch(function(err) {
      console.error('caught error', err);
    });
};

DriveStorage.prototype._removeFile = function(req, file, cb) {
  this.drive.files.delete(
    {
      fileId: file.googleId,
    },
    cb,
  );
};

module.exports = function(opts, preproc) {
  return new DriveStorage(opts, preproc);
};
