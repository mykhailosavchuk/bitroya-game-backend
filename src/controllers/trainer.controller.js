const db = require("../models");
const service = require("../service");
const Hero = db.hero;
const User = db.user;

exports.get = async (req, res) => {
  const Trainer = await service.getTrainers(req.address)

  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ data: err, status: "errors" });
    }

    if(Trainer.ids.includes(user.activedTrainerId)){
      return res.status(200).send({data: Trainer.trainers, status: "success"});
    }else {
      user.activedTrainerId = -1;
      await user.save();
      await updateRemainTime(req.idUser, Trainer.trainers[0].percent, 100);
      return res.status(200).send({data: Trainer.trainers, status: "success"});
    }

  })
}


exports.put = async (req, res) => {
  
  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ data: err, status: "errors" });
    }

    if(!user) {
      return res.status(200).send({ data: err, status: "errors" });
    }
    var Trainer = await service.getTrainers(req.address)

    if(!Trainer.ids.includes(req.body.id)){
      return res.status(200).send({ data: "Please buy trainer", status: "error" });
    }
    
    const preTrainer = await service.getTrainerDetail(user.activedTrainerId);
    const selTrainer = Trainer.trainers.find(t => t.id == req.body.id);

    let prePercent = preTrainer.percent
    user.activedTrainerId = req.body.id;
    await user.save();

    await updateRemainTime(req.idUser, prePercent, selTrainer.percent);

    return res.status(200).send({ data: "success", status: "success"});
      
  })
  
};


const updateRemainTime = async (idUser, prePercent, newPercent) => {

  const heros = await Hero.find({ owner: idUser, stamina: 0, status: true });
    
  var percent = 1 - newPercent / 100;
  var prePercent = 1 - prePercent / 100;

  for(let i=0 ; i<heros.length ; i++) {
        
    const currentRemainTime = (Date.now() - heros[i].enabledAt) - heros[i].remainedTime;
    if(currentRemainTime > 0) {
      heros[i].remainedTime = 0;
      heros[i].stamina = 3;
    }else {
      heros[i].remainedTime = currentRemainTime / prePercent * percent * -1;
      heros[i].stamina = 0;
    }
    
    await heros[0].save()
  }
  
}