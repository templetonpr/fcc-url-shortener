"use strict";

let express = require('express');
let validate = require('./validate');
let pg = require('pg');

let app = express();

let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";

app.get('/', (req, res) => {// home page
  res.sendFile(__dirname + '/public/index.html');
})

.get('/new', (req, res) => {
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
            res.json({
              original_url: result.rows[0].url,
              short_code: result.rows[0].p_id
            });

          } else { // url is new
            client.query('INSERT INTO urls (url) VALUES ($1) RETURNING *', [url], (err, result) => {
              if (handleError(err)) return; // handle error from the query
              done();
              res.json({
                original_url: result.rows[0].url,
                short_code: result.rows[0].p_id
              });
            });
          }
        });
      });

    } else { // if http request returned with something other than 200
      console.log(status);
      res.send("There was a problem checking the URL. Please try again."); // make this send an error json
    }
  });
})

.get('/:short_code', (req, res) => {
  let shortCode = req.params["short_code"];

  pg.connect(conString, (err, client, done) => {

    let handleError = (err) => {
      if (!err) return false; // no error, continue with the request
      if (client) done(client); // remove client from connection pool
      res.status(500).send('An error occurred. Please try again in a few moments.');
      return true;
    };

    if (handleError(err)) return; // handle error from the connection

    client.query('SELECT * FROM urls WHERE p_id=$1', [shortCode], (err, result) => {
      if (handleError(err)) return; // handle error from the query
      done();
      if (result.rowCount) { // url is already in db
        res.json({
          original_url: result.rows[0].url,
          short_code: result.rows[0].p_id
        });
      } else { // url is new
        // return error
        res.send("URL doesn't exist.");
      }
    });
  });
});

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});
