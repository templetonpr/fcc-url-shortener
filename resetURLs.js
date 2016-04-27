"use strict";

let pg = require('pg');
let conString = process.env.DATABASE_URL || "postgres://test:test@localhost/test_db";
let client = new pg.Client(conString);

console.log("Dropping table and recreating...");

client.connect( (err) => {
  if (err) return console.err('Could not connect to postgres', err);
  client.query("DROP TABLE IF EXISTS urls; CREATE TABLE urls (p_id SERIAL PRIMARY KEY,url TEXT);", (err, result) => {
    if (err) return console.err('Error running query', err);
    client.end();
  });
});