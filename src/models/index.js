const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const autoIncrement = require('mongoose-auto-increment');

const db = {};

const options = {
    autoIndex: false, // Don't build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

db.mongoose = mongoose;
// db.connection = db.mongoose.createConnection(`mongodb://uyq2obg9ogl8jr2rtqs6:jTpCeuJ2EBtJTvcxxPvd@n1-c2-mongodb-clevercloud-customers.services.clever-cloud.com:27017,n2-c2-mongodb-clevercloud-customers.services.clever-cloud.com:27017/bnlybsg1eqxws77?replicaSet=rs0`)
db.connection = db.mongoose.createConnection(`mongodb://127.0.0.1:27017/nft-game`)
autoIncrement.initialize(db.connection);

db.user = require("./user.model")(db.connection, autoIncrement);
db.role = require("./role.model")(db.connection, autoIncrement);
db.hero = require("./hero.model")(db.connection, autoIncrement);
db.game = require("./game.model")(db.connection, autoIncrement);
db.token = require("./token.model")(db.connection, autoIncrement);
db.ROLES = ["user", "admin"];

module.exports = db;