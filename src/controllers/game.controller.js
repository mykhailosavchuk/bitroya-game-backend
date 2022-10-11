const crypto = require("crypto");
const { heroContractAddr } = require("../config");
const config = require("../config");
const db = require("../models");
const service = require("../service");
const User = db.user;
const Game = db.game;
const Token = db.token;
const Hero = db.hero;
const NFTContract = require("../blockchain/abis/ERC721.json")

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
        res.status(400).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(400).send({ data: "User Not found.", status: "errors" });
      }

      await Token.deleteMany({user: req.idUser}, {type: "Game"});
      await Game.updateMany({user: req.idUser, result: "Playing"}, {result: "Error"});
      await service.getHeros(req.address)
      const heros = await Hero.find({owner: req.idUser, status: true, idHero: {$in: req.body.heros}, stamina: {$gt: 0}});
      if(!(heros.length == req.body.heros.length)) {
        return res.status(200).send({ data: "Invalid heros", status: "errors" });
      }

      var calls = [];
      for(let i=0 ; i<req.body.heros.length ; i++) {
        calls.push({ address: heroContractAddr, name: 'ownerOf', params: [req.body.heros[i]] })
      }

      const result = await service.multiCall(NFTContract.abi, calls);

      const differenceIds = result.filter(r => r != req.address);
      if(differenceIds.length > 0) {
        return res.status(200).send({ data: "Invalid game", status: "errors" });
      }

      let token = await new Token({
        user: req.idUser,
        type: "Game",
        token: crypto.randomBytes(32).toString("hex"),
      }).save();

      const game = new Game({
        user: req.idUser,
        heros: req.body.heros,
        result: "Playing",
        token: token._id
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

      if (tokens.length == 0) return res.status(401).send({ data: "Game is already finished", status: "errors" });
      // if (!tokens.map(t => t.token).includes(req.token) || !service.checkToken(req.token, req.xToken)) {
      //   return res.status(200).send({ data: "Incorrect token", status: "errors" });
      // }
      const game = await Game.findOne({user: req.idUser, result: "Playing"});
      if(!game.heros.length > 0) {
        return res.status(200).send({ data: "Invalid game", status: "errors" });
      }else {
        var metadatas = []
        for(let i=0 ; i<game.heros.length ; i++) {
          const data = await service.readFile(game.heros[i])
          metadatas.push(data)
        }
        var bossFee = user.bossFee;
        var duration = 0;
        const second = 1000 * 60;
        while(metadatas.length > 0) {
          if(metadatas[0].attributes.health <= 0) {
            metadatas.shift();
          }
          var count = 3;
          if(metadatas.length < 3) {
            count = metadatas.length
          }
          for(let i=0 ; i<count ; i++) {
            bossFee -= metadatas[i].attributes.attack;
          }
          duration += 3.5 * second;
          if(metadatas.length > 0) {
            metadatas[0].attributes.health -= 2;
          }
        }

        if((game.createdAt + duration <= Date.now())) {
          return res.status(200).send({ data: "Invalid game", status: "errors" });
        }
        if (bossFee <= 0) {
          if (!user.isFirstWin) {
            await User.findOneAndUpdate({ _id: req.idUser }, { isFirstWin: true, firstWinAt: Date.now(), awardAmount: config.awardAmount });
          } else {
            await User.findOneAndUpdate({ _id: req.idUser }, { $inc: { 'awardAmount': config.awardAmount } });
          }
          await User.findOneAndUpdate({ _id: req.idUser }, { bossFee: 1000 });
          await Game.updateOne({ user: req.idUser, result: "Playing" }, {result: "Win" });
        }else {
          await User.findOneAndUpdate({ _id: req.idUser }, { bossFee });
          await Game.updateOne({ user: req.idUser, result: "Playing" }, {result: "Loss" });
        }
      }

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

