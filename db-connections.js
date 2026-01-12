//import the mysql2 library
var mysql = require('mysql2');

//create the connection to the database
var connection = mysql.createConnection({
    host: 'localhost', //IP of the database server
    port: '3306', //port of the database server
    user: 'root', //user of the database server
    password: 'adev', //password of the database server
    database: 'animaladoptoin' //database name
});

//Test connection. If there is an error, console.log the error
connection.connect(err => {
    if (err) throw err;
    console.log('Connected to DB');
})

//Export the connection so that it can be used by others script
module.exports = connection;
