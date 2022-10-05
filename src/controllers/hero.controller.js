const config = require("../config")
const db = require("../models");
const service = require("../service")
const Hero = db.hero;
const User = db.user;

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

      const deletedHeros = await Hero.find({ idHero: { $not: { $in: ids } } })

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

exports.change = async (req, res) => {
  const isInclude = await verifyOwner(req.address, [req.body.id]);
  if (!isInclude) {
    return res.status(200).send({ data: "Token balance error! Please reload your tokens", status: "errors" });
  }

  const Land = await service.getLands(req.address)
  const Trainer = await service.getTrainers(req.address)

  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {
      if (err) {
        return res.status(200).send({ data: err, status: "errors" });
      }

      const selLand = Land.lands.find(l => l.id === user.activedLandId);
      const count = await Hero.count({ owner: req.idUser, status: true });
      if (selLand?.heroCount <= count && req.body.status) {
        return res.status(200).send({ data: "The number of available actives has reached the limit.", status: "errors" });
      }
      var selTrainer = Trainer.trainers.find(t => t.id === user.activedTrainerId);
      if (!selTrainer) {
        selTrainer = Trainer.trainers[0]
      }
      var percent = 1 - selTrainer.percent / 100;

      Hero.findOne({
        idHero: req.body.id
      })
        .exec(async (err, hero) => {
          if (err) {
            return res.status(200).send({ data: "Incorrect id or password", status: "errors" });
          }

          if (!hero) {
            // const newHero = new Hero({
            //   address: req.address,
            //   status: req.body.status,
            //   user: req.idUser,
            //   remainedTime: percent * config.aliveDuration
            // });
            // await newHero.save();
            // user.activedTrainerId = req.body.id;
            // user.save();

            // return res.status(200).send({
            //   status: "success",
            //   data: newHero,
            // });
            return res.status(200).send({
              status: "errors",
              data: "not exist hero"
            });
          } else {

            let stamina = 3;
            if (req.body.stamina) {
              stamina = hero.stamina - 1;
              if (stamina < 1) {
                hero.remainedTime = config.aliveDuration * percent;
                stamina = 0;
              }
              hero.stamina = stamina;
            } else if (req.body.status && !hero.status) {

              hero.enabledAt = Date.now()
              hero.status = req.body.status
              hero.stamina = 0;
              hero.remainedTime = config.aliveDuration * percent;

            } else if (!req.body.status && hero.status) {
              hero.stamina = 0;
              hero.remainedTime = config.aliveDuration * percent;
              hero.status = req.body.status
              hero.enabledAt = Date.now()
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

