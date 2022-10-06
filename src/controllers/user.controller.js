const db = require("../models");
const service = require("../service");
const User = db.user;

exports.dashboard = async (req, res) => {

  User.findOne({ _id: req.idUser })
    .populate('roles')
    .exec(async (err, user) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }

      const lands = await service.getLands(req.address);
      const trainers = await service.getTrainers(req.address);


      return res.status(200).send({
        data: {
          user,
          lands: lands.lands,
          trainers: trainers.trainers

        }, status: "errors"
      });
    })
};

exports.getBossFee = async (req, res) => {

  User.findOne({ _id: req.idUser })
    .exec(async (err, user) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(404).send({ data: "User Not found.", status: "errors" });
      }

      return res.status(200).send({
        data: user.bossFee, status: "errors"
      });
    })
};

exports.setRole = (req, res) => {
  User.findOne({ _id: req.params.id })
    .populate('roles')
    .exec((err, user) => {

      if (err) {
        res.status(500).send({ data: err, status: "errors" });
        return;
      }

      if (!user) {
        return res.status(404).send({ data: "Orders Not found.", status: "errors" });
      }

      Role
        .find({ name: req.params.role },
          (err, roles) => {
            if (err) {
              return;
            }
            user.roles = roles.map(role => role._id);
            user.adminType = req.params.type
            user.save(err => {
              if (err) {
                return;
              }
              User.findOne({ _id: user._id })
                .populate('roles')
                .exec((err, fUser) => {
                  if (err) {
                    res.status(500).send({ data: err, status: "errors" });
                    return;
                  }

                  if (!fUser) {
                    return res.status(404).send({ data: "Orders Not found.", status: "errors" });
                  }
                  res.status(200).json({ data: fUser, status: "success" });
                })
            });
          }
        );
    })
};


exports.delete = (req, res) => {
  User.deleteOne({ _id: req.params.id })
    .exec(() => {
      res.status(200).send();

    })
};
