const crypto = require("crypto")
const config = require("../config");
const db = require("../models");
const service = require("../service");
const User = db.user;
const Game = db.game;
const Token = db.token;

exports.query = (req, res) => {

  var query = {}
  if(req.body.address) {
    query.user = req.body.address;
  }
  if(req.body.result) {
    query.result = req.body.result;
  }

  Game.find(query)
    .popluate("user")
    .popluate("heros")
    .exec(async (err, games) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors"  });
        return;
      }

      if (!games) {
        return res.status(404).send({ data: "Games Not found.", status: "errors" });
      }
        
      return res.status(200).send({data: games, status: "success"});    
    })
};


exports.create = (req, res) => {
  User.find()
    .exec(async (err, users) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!users) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }

      let token = await new Token({
        user: req.idUser,
        type: "Game",
        token: crypto.randomBytes(32).toString("hex"),
      }).save();
        
      const game = new Game({
        user: req.idUser,
        heros: req.body.heros
      })

      await game.save();
      return res.status(200).send({data: game, token: token.token, status: "success"});    
    })
};

exports.upate = async (req, res) => {

  const tokens = await Token.find({
    user: req.idUser,
    type: "Game",
  });

  if (tokens.length === 0) return res.status(200).send({data: "Token doesn't exist", status: "errors"});
  if(!tokens.map(t => t.token).includes(req.token)) {
    return res.status(200).send({data: "Incorrect token", status: "errors"});
  }

  if(req.body.result === "Win") {
    const user = await User.findOne({_id: req.idUser})
    if(!user.isFirstWin) {
      await User.findOneAndUpdate({_id: req.idUser}, { isFirstWin: true, firstWinAt: Date.now(), awardAmount: config.awardAmount });  
    }else {
      await User.findOneAndUpdate({_id: req.idUser}, { $inc: { 'awardAmount': config.awardAmount} });  
    }
  }
  await Game.updateOne({user: req.idUser, result: req.body.result});
  await Token.deleteMany({_id: {$in: tokens.map(t => t._id)}});

  return res.status(200).send({data: "success", status: "success"});    
};

exports.claim = async (req, res) => {
  const user = await User.findOne({_id: req.idUser});

  if(user.awardAmount > config.minClaimAmount && Date.now() - user.firstWinAt >= config.claimEnableDate) {
    console.log(Date.now() - user.firstWinAt, config.claimEnableDate)

    const differenceDate = Number.parseInt((Date.now() - user.firstWinAt - config.claimEnableDate) / config.day);
    let feePercent = 0.5 - differenceDate * 0.05
    feePercent = feePercent > 0 ? feePercent : 0
    console.log(feePercent)
    await User.updateOne({_id: req.idUser}, {awardAmount: 0, isFirstWin: false});
    // await service.claim(req.address, user.awardAmount - user.awardAmount * feePercent );
    return res.status(200).send({data: "success", status: "success"});    
  }
  return res.status(200).send({data: `Amount should be at least ${config.minClaimAmount}`, status: "errors"});    
};

