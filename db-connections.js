//import env data
require("dotenv").config();

//import the mysql2 library
var mysql = require('mysql2');

//create the connection to the database
var connection = mysql.createConnection({
    host: process.env.DB_HOST, //IP of the database server
    port: process.env.DB_PORT, //port of the database server
    user: process.env.DB_USER, //user of the database server
    password: process.env.DB_PASSWORD, //password of the database server
    database: process.env.DB_NAME //database name
});

//Test connection. If there is an error, console.log the error
connection.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');
})

//Export the connection so that it can be used by others script
module.exports = connection;
