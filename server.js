"use strict";

let pg = require('pg');
let express = require('express');
var favicon = require('serve-favicon');

let validate = require('./validate');

let app = express();
app.use(favicon(__dirname + '/public/favicon.ico'));


let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";

app.all((req, res, next) => {
    next();
})

.get('/', (req, res, next) => {// home page
  res.sendFile(__dirname + '/public/index.html');
})

.get('/new', (req, res, next) => {
  let url = decodeURIComponent(req.query["original-url"]);

  validate.checkUrl(url, (err, status) => {
    if (err) { // if validator says the url is invalid
      console.log(err);
      res.send("That URL isn't valid. Please make sure it's correct and try again."); // make this send an error json
    } else if (status === 200 || 301 || 302) {

      pg.connect(conString, (err, client, done) => {

        let handleError = (err) => {
          if (!err) return false; // no error, continue with the request
          if (client) done(client); // remove client from connection pool
          res.status(500).send('An error occurred. Please try again in a few moments.');
          return true;
        };

        if (handleError(err)) return; // handle error from the connection

        client.query('SELECT * FROM urls WHERE url=$1', [url], (err, result) => {
          if (handleError(err)) return; // handle error from the query
          done();

          if (result.rowCount) { // url is already in db
            res.status(200).json({
              original_url: result.rows[0].url,
              short_code: result.rows[0].p_id
            });

          } else { // url is new
            client.query('INSERT INTO urls (url) VALUES ($1) RETURNING *', [url], (err, result) => {
              if (handleError(err)) return; // handle error from the query
              done();
              res.status(201).json({
                original_url: result.rows[0].url,
                short_code: result.rows[0].p_id
              });
            });
          }
        });
      });

    } else { // if http request returned with something other than 200
      console.log(status);
      res.status(400).json({error: "There was a problem checking the URL. Please make sure it is correct and try again."});
    }
  });
})

.get('/:short_code', (req, res, next) => {
  let shortCode = req.params["short_code"];

  pg.connect(conString, (err, client, done) => {

    let handleError = (err) => {
      if (!err) return false; // no error, continue with the request
      if (client) done(client); // remove client from connection pool
      res.status(500).json({error: "Internal server error. Please try again in a moment."});
      return true;
    };

    if (handleError(err)) return; // handle error from the connection

    client.query('SELECT * FROM urls WHERE p_id=$1', [shortCode], (err, result) => {
      if (handleError(err)) return; // handle error from the query
      done();
      if (result.rowCount) { // url is already in db
        res.redirect(result.rows[0].url)
      } else { // url is new
        res.status(400).json({error: "URL doesn't exist."}); // return error
      }
    });
  });
});

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});
