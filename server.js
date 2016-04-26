"use strict";

let express = require('express');
let validate = require('./validate');

// @todo add db

let app = express();

app.get('/', (req, res) => {
  // home page
  res.sendFile(__dirname + '/public/index.html');
})

.get('/new/:url', (req, res) => {
  let url = req.params.url; // @todo unencode this

  validate.checkUrl(url, (err, status) => {
    if (err) {
      console.log(err);
      res.send("That URL isn't valid. Please make sure it's correct and try again.");
    } else if (status === 200) {
      res.send("Got " + url);
    } else {
      console.log(status);
      res.send("There was a problem checking the URL. Please try again.");
    }
  });
})

// @todo add routing for existing urls
;

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});
