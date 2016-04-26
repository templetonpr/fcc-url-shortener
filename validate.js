"use strict";

let validator = require('validator');

exports.checkUrl = (testUrl, callback) => {
  if (validator.isURL(testUrl)) {

    let http = require('http');
    let url = require('url');

    let options = {
      method: 'HEAD',
      hostname: url.parse(testUrl).host,
      path: url.parse(testUrl).pathname
    };

    let code = 500;
    let req = http.request(options, (res) => {
      code = res.statusCode;
      callback(null, code);
    });
    req.end();

  } else {
    // validator says testUrl is an invalid url
    let error = new Error("Invalid URL");
    callback(error);
  }
};