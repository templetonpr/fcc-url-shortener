"use strict";

let express = require('express')
let app = express();

app.get('/', (req, res) => {
  // home page
  res.sendFile(__dirname + '/public/index.html');
});

let port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log("Server is running on port " + port + "\n");
});
