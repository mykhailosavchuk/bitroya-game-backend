const crypto = require("crypto")
const config = require("../config");
const db = require("../models");
const service = require("../service");
const User = db.user;
const Game = db.game;
const Token = db.token;

exports.query = (req, res) => {

  var query = {}
  if (req.body.address) {
    query.user = req.body.address;
  }
  if (req.body.result) {
    query.result = req.body.result;
  }

  Game.find(query)
    .popluate("user")
    .popluate("heros")
    .exec(async (err, games) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!games) {
        return res.status(404).send({ data: "Games Not found.", status: "errors" });
      }

      return res.status(200).send({ data: games, status: "success" });
    })
};


exports.create = (req, res) => {
  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {

      if (err) {
        res.status(200).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(200).send({ data: "User Not found.", status: "errors" });
      }

      await Token.deleteMany({user: req.idUser, type: "Game"});
      await Game.updateMany({user: req.idUser, result: "Error"});

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
      return res.status(200).send({ data: game, token: token.token, status: "success" });
    })
};

exports.upate = async (req, res) => {
  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }
      const tokens = await Token.find({
        user: req.idUser,
        type: "Game",
      });

      if (tokens.length === 0) return res.status(200).send({ data: "Game is already finished", status: "errors" });
      if (!tokens.map(t => t.token).includes(req.token)) {
        return res.status(200).send({ data: "Incorrect token", status: "errors" });
      }

      if (req.body.result === "Win") {
        const user = await User.findOne({ _id: req.idUser })
        if (!user.isFirstWin) {
          await User.findOneAndUpdate({ _id: req.idUser }, { isFirstWin: true, firstWinAt: Date.now(), awardAmount: config.awardAmount });
        } else {
          await User.findOneAndUpdate({ _id: req.idUser }, { $inc: { 'awardAmount': config.awardAmount } });
        }
        await User.findOneAndUpdate({ _id: req.idUser }, { bossFee: 1000 });
      }else {
        await User.findOneAndUpdate({ _id: req.idUser }, { bossFee: req.body.bossFee });
      }

      await Game.updateOne({ user: req.idUser, result: req.body.result });
      await Token.deleteMany({ _id: { $in: tokens.map(t => t._id) } });

      return res.status(200).send({ data: "success", status: "success" });
    })
};

exports.claim = async (req, res) => {
  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }

      if (user.awardAmount > config.minClaimAmount && Date.now() - user.firstWinAt >= config.claimEnableDate) {

        const differenceDate = Number.parseInt((Date.now() - user.firstWinAt - config.claimEnableDate) / config.day);
        let feePercent = 0.5 - differenceDate * 0.05
        feePercent = feePercent > 0 ? feePercent : 0
        await User.updateOne({ _id: req.idUser }, { awardAmount: 0, isFirstWin: false });
        // await service.claim(req.address, user.awardAmount - user.awardAmount * feePercent );
        return res.status(200).send({ data: "success", status: "success" });
      }
      return res.status(200).send({ data: `Amount should be at least ${config.minClaimAmount}`, status: "errors" });
  })
};

