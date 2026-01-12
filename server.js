var express = require("express");
var db = require("./db-connections");

var app = express();

app.use(express.json());
app.use(express.static("./public"));

app.route('/index.html').get(function(req,res){
    //
});


app.listen(1338, "127.0.0.1");
console.log("[+] Web server is running @ http://127.0.0.1:1338");
