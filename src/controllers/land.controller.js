const db = require("../models");
const service = require("../service");
const Hero = db.hero;
const User = db.user;

exports.get = async (req, res) => {
  const Land = await service.getLands(req.address)

  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ message: err, status: "errors" });
    }

    if(Land.ids.includes(user.activedLandId)){
      return res.status(200).send({ data: {lands: Land, activedLandId: user.activedLandId}, status: "success" });
    }else {
      user.activedLandId = -1;
      await user.save();
      return res.status(200).send({ data: {lands: Land, activedLandId: 0}, status: "success" });
    }

  })
}

exports.put = async (req, res) => {

  const { lands } = await service.getLands(req.address);
  User.updateOne({_id: req.idUser}, {activedLandId: req.body.id});

  User.findOne({_id: req.idUser})
  .exec(async (err, user) => {
    if (err) {
      return res.status(200).send({ message: err, status: "errors" });
    }
    const count = await Hero.count({owner: req.idUser, status: true});
    const selLand = lands.find(l => l.id === user.activedLandId)
    if(count > selLand?.heroCount) {
      await Hero.updateMany({_id: req.idUser}, {status: false});
    }
    user.activedLandId = req.body.id;
    await user.save();
    return res.status(200).send({ message: "success", status: "success" });
    
  })
  
};


