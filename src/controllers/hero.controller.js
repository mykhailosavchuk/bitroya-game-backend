const config = require("../config")
const db = require("../models");
const service = require("../service")
const Hero = db.hero;
const User = db.user;

exports.get = async (req, res) => {
  const {ids, heros} = await service.getHeros(req.address);

  const deletedHeros = await Hero.find({idHero: {$not: {$in: ids}}})

  await Hero.deleteMany({_id: {$in: deletedHeros.map(h => h._id)}})

  const count = await Hero.count({user: req.idUser});

  if(ids.length > count) {
    for(var i=0 ; i<ids.length ; i++) {
      const hero = await Hero.findOne({idHero: ids[i]})
      if(hero) {
        hero.owner = req.idUser
      }else {
        await new Hero({
          idHero: ids[i],
          owner: req.idUser
        }).save();   
      }
    }
  }

  return res.status(200).send({data: heros, status: "success"});
}

exports.change = async (req, res) => {
  const isInclude = await verifyOwner(req.address, [req.body.id]);
  if(!isInclude) {
    return res.status(200).send({ data: "Token balance error! Please reload your tokens", status: "errors" });
  }

  const Land = await service.getLands(req.address)
  const Trainer = await service.getTrainers(req.address)
  const HeroData = await service.getHeros(req.address)

  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ data: err, status: "errors" });
    }
    
    const selLand = Land.lands.find(l => l.id === user.activedLandId);
    
    if(selLand?.heroCount === HeroData.ids.length && req.body.status) {
      return res.status(200).send({ data: "The number of available actives has reached the limit.", status: "errors" });
    }
    const selTrainer = Trainer.trainers.find(t => t.id === user.activedTrainerId);
    var percent = 1 - selTrainer.percent / 100;

    Hero.findOne({
      idHero: req.body.id
    })
    .exec(async (err, hero) => {
      if (err) {
        return res.status(200).send({ data: "Incorrect id or password", status: "errors" });
      }
  
      if (!hero) {
        const newHero = new Hero({
          address: req.address,
          status: req.body.status,
          user: req.idUser,
          remainedTime: percent * config.aliveDuration
        });
        await newHero.save();
        user.activedTrainerId = req.body.id;
        user.save();
  
        return res.status(200).send({
          status: "success",
          data: hero,
        });
      }else {
  
        let stamina = 3;
        if(req.body.stamina) {
          stamina = hero.stamina - 1;
          if(stamina < 0) {
            hero.isAlive = false;
            hero.activedAt = Date.now();
            hero.remainedTime = config.aliveDuration * percent;
          }
          hero.stamina  = stamina;
        }else if(req.body.status && !hero.status) {

          hero.activedAt = Date.now();
          hero.status = req.body.status
          hero.remainedTime = config.aliveDuration * percent;

        }else if(!req.body.status && hero.status) {
          if(hero.remainedTime * 1000 + hero.activedAt > Date.now()) {
            hero.isAlive = true;
          }else {
            hero.remainedTime = config.aliveDuration * percent;
          }
          hero.status = req.body.status
        }
  
        await hero.save();
        user.activedTrainerId = req.body.id;
        user.save();
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

