const config = require("../config")
const db = require("../models");
const service = require("../service")
const Hero = db.hero;
const User = db.user;
const Token = db.token;

exports.get = async (req, res) => {

  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {
      if (err) {
        return res.status(200).send({ data: err, status: "errors" });
      }

      if (!user) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }

      const { ids, heros } = await service.getHeros(req.address);

      const deletedHeros = await Hero.find({ owner: req.idUser, idHero: { $not: { $in: ids } } })

      await Hero.deleteMany({ _id: { $in: deletedHeros.map(h => h._id) } })

      const count = await Hero.count({ owner: req.idUser });

      if (ids.length > count) {
        for (var i = 0; i < ids.length; i++) {
          const hero = await Hero.findOne({ idHero: ids[i] })
          if (hero) {
            hero.owner = req.idUser
          } else {
            await new Hero({
              idHero: ids[i],
              owner: req.idUser
            }).save();
          }
        }
      }

      const viewHeros = heros.map(h => ({
        TokenId: h.id,
        Name: h.name,
        Image: h.image,
        Description: h.description,
        Royalty: h.royalty,
        Attack: h.attack,
        Health: h.health,
        Stamina: h.stamina,
        RemainedTime: h.remainedTime,
        IsActive: h.actived
      }))

      return res.status(200).send({ data: viewHeros, status: "success" });

    })
}

exports.changeStatus = async (req, res) => {
  const isInclude = await verifyOwner(req.address, [req.body.id]);
  if (!isInclude) {
        return res.status(200).send({ data: "Token balance error! Please reload your tokens", status: "errors" });
  }

  const Land = await service.getLands(req.address)
  const Trainer = await service.getTrainers(req.address)

  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {
      if (err) {
        return res.status(400).send({ data: err, status: "errors" });
      }

      var selLand = Land.lands.find(l => l.id == user.activedLandId);
      if(!selLand) {
        selLand = Land.lands[0];
        await User.updateOne({_id: req.idUser}, {activedLandId: selLand.id})
      }
      const count = await Hero.count({ owner: req.idUser, status: true });
      if (selLand?.heroCount < count) {
        await Hero.updateMany({owner: req.idUser}, {status: false});
        return res.status(400).send({ data: `The number of available actives has reached the limit. expected count: ${selLand?.heroCount}`, status: "errors" });
      }else if (selLand?.heroCount <= count && req.body.status) {
        return res.status(400).send({ data: `The number of available actives has reached the limit. expected count: ${selLand?.heroCount}`, status: "errors" });
      }
      var selTrainer = Trainer.trainers?.find(t => t.id == user.activedTrainerId);
      if (!selTrainer) {
        selTrainer = Trainer.trainers[0]
      }
      var percent = 1 - selTrainer.percent / 100;

      Hero.findOne({
        idHero: req.body.id
      })
        .exec(async (err, hero) => {
          if (err) {
            return res.status(400).send({ data: err, status: "errors" });
          }

          if (!hero) {
            return res.status(400).send({
              status: "errors",
              data: "not exist hero"
            });
          } else {

            hero.status = req.body.status
            hero.owner = req.idUser
            hero.stamina = 0;
            hero.enabledAt = Date.now()
            hero.remainedTime = config.aliveDuration * percent;

            await hero.save();
            return res.status(200).send({
              status: "success",
              data: hero,
            });
          }
        });

    })

};

exports.getHeroDetail = async (req, res) => {

  const h = await service.getHeroDetail(req.params.id);
  return res.status(200).send({data: {
    TokenId: h.id,
    Name: h.name,
    Image: h.image,
    Description: h.description,
    Royalty: h.royalty,
    Attack: h.attack,
    Health: h.health,
    Stamina: h.stamina,
    RemainedTime: h.remainedTime,
    IsActive: h.actived
  }, status: "success"})

}


exports.changeStamina = async (req, res) => {
  const isInclude = await verifyOwner(req.address, [req.body.id]);
  if (!isInclude) {
    return res.status(401).send({ data: "Token balance error! Please reload your tokens", status: "errors" });
  }

  const token = await Token.findOne({user: req.idUser, type: "Game", token: req.token})
  if(!token || !service.checkToken(req.token, req.xToken)) {
    return res.status(401).send({ data: "Game is finished and other one is started.", status: "errors" });
  }

  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {
      if (err) {
        return res.status(200).send({ data: err, status: "errors" });
      }

      Hero.findOne({
        idHero: req.body.id
      })
        .exec(async (err, hero) => {
          if (err) {
            return res.status(200).send({ data: "Incorrect id or password", status: "errors" });
          }

          const Trainer = await service.getTrainers(req.address)
          var selTrainer = Trainer.trainers.find(t => t.id == user.activedTrainerId);
          if (!selTrainer) {
            selTrainer = Trainer.trainers[0]
          }
          var percent = 1 - selTrainer.percent / 100;

          if (!hero) {
            return res.status(200).send({
              status: "errors",
              data: "not exist hero"
            });
          } else {

            let stamina = 3;
            if (req.body.stamina) {
              if(hero.stamina == 0) {
                return res.status(401).send({ data: "Not be able to use hero", status: "errors" });
              }
              stamina = hero.stamina - 1;
              if (stamina < 1) {
                hero.remainedTime = config.aliveDuration * percent;
                hero.enabledAt = Date.now();
                stamina = 0;
              }
              hero.stamina = stamina;
            }

            await hero.save();
            return res.status(200).send({
              status: "success",
              data: hero,
            });
          }
        });

    })

};


const verifyOwner = async (account, ids) => {
  return true;
}

