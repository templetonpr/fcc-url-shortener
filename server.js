"use strict";

let pg = require('pg');
let express = require('express');
let favicon = require('serve-favicon');
let bodyParser = require('body-parser');

let validate = require('./validate');

let app = express();
app.disable('x-powered-by');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";

pg.defaults.ssl = true;
pg.connect(process.env.DATABASE_URL, function(err, client) {
  if (err) throw err;
  console.log('Connected to postgres! Getting schemas...');

  client
    .query('SELECT table_schema,table_name FROM information_schema.tables;')
    .on('row', function(row) {
      console.log(JSON.stringify(row));
    });
});

app.get('/*', (req, res, next) => {
  next();
})

.get('/', (req, res) => { // home page
  res.sendFile(__dirname + '/public/index.html');
})

.get('/new', (req, res) => {
  // this will send a page with a form for manual usage
  res.sendFile(__dirname + '/public/newUrl.html');
})

.post('/new', (req, res) => {
  let url = req.body["original_url"];

  validate.checkUrl(url, (err, status) => {
    if (err) { // validator says the url is invalid
      res.status(400).json({error: "That URL isn't valid. Please make sure it's correct and try again."});

    } else if (status >= 400 && status < 500) { // there was a problem visiting the url
      res.status(400).json({error: "There was a problem checking the URL. Please make sure it is correct and try again. Status code: " + status});

    } else { // validation went okay
      pg.connect(conString, (err, client, done) => {
        if (handleDbError(err)) return; // handle error from the connection

        client.query('SELECT * FROM urls WHERE url=$1', [url], (err, result) => {
          if (handleDbError(err)) return; // handle error from the query
          if (result.rowCount) { // url is already in db
            done();
            res.status(200).json({
              original_url: result.rows[0].url,
              short_url: getHostname(req, result)
            });

          } else { // url is new
            client.query('INSERT INTO urls (url, created_on, access_count) VALUES ($1, $2, 0) RETURNING *', [url, Date.now().toString()], (err, result) => {
              if (handleDbError(err)) return; // handle error from the query
              done();
              res.status(201).json({
                original_url: result.rows[0].url,
                short_url: getHostname(req, result)
              });
            });
          }

        });
      });
    }
  });
})

.get('/:short_code', (req, res) => {
  let shortCode = req.params["short_code"];

  pg.connect(conString, function (err, client, done) {
    if (handleDbError(err)) return; // handle error from the connection

    client.query('SELECT * FROM urls WHERE p_id=$1', [shortCode], (err, result) => {
      if (handleDbError(err)) return; // handle error from the query

      if (result.rowCount) { // url is already in db
        let url = result.rows[0].url;
        let newCount = result.rows[0]["access_count"] + 1;

        client.query('UPDATE urls SET access_count = $1 WHERE p_id = $2', [ newCount, shortCode ], (err, result) => {
          if (handleDbError(err)) return;
          done();
          return res.redirect(url);
        });

      } else { // url is new
        res.status(404).json({error: "URL doesn't exist."});
      }

    });
  });
});

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});

let handleDbError = (err, client, res) => {
  if (!err) {
    return false; // no error, continue with the request
  } else if (client) done(client); // remove client from connection pool
  console.error(err);
  res.status(500).json({error: "Internal server error. Please try again in a moment."});
  return true;
};

let getHostname = (req, result) => {
  let hostname = req.protocol + "://" + req.hostname;
  if (req.hostname === "localhost") hostname += ":" + port;
  hostname += "/" + result.rows[0].p_id;
  return hostname;
}