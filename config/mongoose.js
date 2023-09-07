const mongoose = require("mongoose");


mongoose.connect(
  "mongodb+srv://soumitra:56789123%40Sg@cluster0.qtleogu.mongodb.net/login-db?retryWrites=true&w=majority"
);

const db = mongoose.connection;


db.on("error", console.error.bind(console, "error in connecting the database"));


db.once("open", function () {
  console.log("succesfully connected to database");
});

module.exports = db;