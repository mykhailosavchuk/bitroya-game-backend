const db = require("../models");
const User = db.user;
const Role = db.role;
const config = require("../config/auth.config");
var jwt = require("jsonwebtoken");
const service = require("../service")

exports.connect = async (req, res) => {

  const address = await service.recoverSignature(req.body.signature);
  console.log(address)
  if(req.body.address !== address) {
    return res.status(400).send({ data: "Signature error", token: "", status: "errors" });
  }else {

    User.findOne({
      address: address
    })
    .populate("roles", "-__v")
    .exec((err, user) => {
      if (err) {
        res.status(400).send({ data: "Incorrect id or password", token: "", status: "errors" });
        return;
      }
      if (!user) {
        const newUser = new User({
          address: address,
        });
        Role.findOne({ name: "user" }, async (err, role) => {
          if (err) {
            return res.status(400).send({ 
              data: "Role doesn't exist.",
              token: "", 
              status: "errors"
            });
          }

          if(!role) {
            return  res.status(400).send({ 
              data: "Role doesn't exist.",
              token: "", 
              status: "errors"
            });
          }
  
          newUser.roles = [role._id];
          await newUser.save();
  
          var token = jwt.sign({ address: address, idUser: newUser._id }, config.secret, {
            expiresIn: 86400 // 24 hours
          });
    
          return res.status(200).send({
            status: "success",
            token,
            data: newUser
          });
        });
      }else {
        var token = jwt.sign({ address: address, idUser: user._id }, config.secret, {
          expiresIn: 86400 // 24 hours
        });
    
        return res.status(200).send({
          status: "success",
          token,
          data: user
        });
      }
    });
  }
};

