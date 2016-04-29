"use strict";

let pg = require('pg');
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

let client = new pg.Client(conString);

console.log("Dropping table and recreating...");

client.connect( (err) => {
  if (err) return console.err('Could not connect to postgres', err);
  client.query(
    "DROP TABLE IF EXISTS urls;\
    CREATE TABLE urls (\
    p_id SERIAL PRIMARY KEY,\
    url TEXT NOT NULL,\
    created_on CHAR(13) NOT NULL,\
    access_count INTEGER NOT NULL);", (err, result) => {
    if (err) return console.err('Error running query', err);
    client.end();
  });
});