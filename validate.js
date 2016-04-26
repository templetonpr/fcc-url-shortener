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

    http.request(options, (res) => {
      callback(null, res.statusCode);
    });
  } else {
    let error = new Error("Invalid URL");
    callback(error);
  }
};