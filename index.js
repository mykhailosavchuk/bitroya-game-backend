const express = require("express");
var path = require('path');
const cors = require("cors");
const Web3 = require('web3');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const passport    = require('passport');
const session = require('express-session');

const GameContract = require("./src/blockchain/abis/Game.json");
const NFTContract = require("./src/blockchain/abis/ERC721.json");
const MulticallContract = require("./src/blockchain/abis/Multicall.json");
const service = require("./src/service");
const indexRouter = require("./src/routes");

const { privateKey, trainerContractAddr, landContractAddr, heroContractAddr, multicallAddress, gameContractAddr } = require("./src/config");
const { secret } = require("./src/config/auth.config")

require('dotenv').config(); 

const app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
	secret: secret,
	resave: true,
	saveUninitialized: true,
	cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))
app.set("view engine", "ejs")
var corsOptions = {
  origin: "*"
};

app.use(cors(corsOptions));


(async () => {
  try{
    const web3 = new Web3(new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org'));
    const account = web3.eth.accounts.privateKeyToAccount(privateKey)

    service.web3 = web3;
    service.account = account;
    service.trainerContract = new web3.eth.Contract(NFTContract.abi, trainerContractAddr);
    service.landContract = new web3.eth.Contract(NFTContract.abi, landContractAddr);
    service.heroContract = new web3.eth.Contract(NFTContract.abi, heroContractAddr);
    // service.multicallContract = new web3.eth.Contract(MulticallContract.abi, multicallAddress);
    service.gameContract = new web3.eth.Contract(GameContract.abi, gameContractAddr);

  } catch (evt) {
    console.log(evt);
  }
})();

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
      res.status(200).end()
      return;
  }
  // Pass to next layer of middleware
  next();
});

app.use('/api', indexRouter); 

app.get("/", (req, res) => {
  return res.send("Welcome!");
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

const db = require("./src/models");
const Role = db.role;
const User = db.user;
db.connection.on("open", () => {
  console.log("Successfully connect to MongoDB.");
  initial();
})
db.connection.on("error", (err) => {
  console.error("Connection error", err);
  process.exit();
})

// set port, listen for requests
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});


function initial() {
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

          const adminUser = new User({
            address: '0x02fc14d01F4E073829276cc2f4f94Fb4EDe1e0c4',
            enabled: true,
          })
          Role.find({name: 'admin'}, (err, roles) => {
              if (err) {
                return;
              }
      
              adminUser.roles = roles.map(role => role._id);
              adminUser.save(err => {
                if (err) {
                  return console.log(err);
                }

                console.log("Database is initialized successfuly!")
              });
          });
        
      });
    }
  });
}
