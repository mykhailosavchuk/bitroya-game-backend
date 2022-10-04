const db = require("../models");
const service = require("../service");
const Hero = db.hero;
const User = db.user;

exports.get = async (req, res) => {
  const Trainer = await service.getTrainers(req.address)

  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ message: err, status: "errors" });
    }

    if(Trainer.ids.includes(user.activedTrainerId)){
      return res.status(200).send({ data: {ids: Trainer.ids, trainers: Trainer.trainers, activedTrainerId: user.activedTrainerId}, status: "success" });
    }else {
      user.activedTrainerId = -1;
      await user.save();
      await updateRemainTime(req.idUser, Trainer.trainers[0].percent, 100);
      return res.status(200).send({ data: {ids: Trainer.ids, trainers: Trainer.trainers, activedTrainerId: 0}, status: "success" });
    }

  })
}


exports.put = async (req, res) => {
  
  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ message: err, status: "errors" });
    }

    if(!user) {
      return res.status(200).send({ message: err, status: "errors" });
    }
    var Trainer = await service.getTrainers(req.address)

    if(Trainer.ids.includes(req.body.id)){
      return res.status(200).send({ message: "Please buy trainer", status: "error" });
    }
    
    const preTrainer = await service.getTrainerDetail(user.activedTrainerId);

    let prePercent = preTrainer.percent
    user.activedTrainerId = req.body.id;

    await updateRemainTime(req.idUser, prePercent, Trainer.trainers[req.body.id].percent);

    return res.status(200).send({ message: "success", status: "success"});
      
  })
  
};


const updateRemainTime = async (idUser, prePercent, newPercent) => {

  const heros = await Hero.find({ owner: idUser, isAlive: false, status: true });
    
  var percent = 1 - newPercent / 100;
  var prePercent = 1 - prePercent / 100;

  for(let i=0 ; i<heros.length ; i++) {
    const hero = await Hero.findOne({_id: heros[i]._id});
        
    if(hero.status) {
      hero.remainedTime = (hero.remainedTime - (Date.now() - hero.enabledAt) / 1000) / prePercent * percent;
      if(hero.remainedTime * 1000 + hero.enabledAt > Date.now()) {
        hero.isAlive = true;
      }
    }else {
      hero.remainedTime = hero.remainedTime * percent;
    }
  
    await hero.save()
  }
  
}