const mongoose = require("mongoose");
var timestamps = require('mongoose-unix-timestamp-plugin');
const config = require("../config")

module.exports = (connection, autoIncrement) => {

  const HeroSchema = new mongoose.Schema({
    idHero: {
      type: Number,
    },
    stamina: {
      type: Number,
      default: 0,
      max: 3,
      min: 0
    },
    isAlive: {
      type: Boolean,
      default: false
    },
    enabledAt: {
      type: Number,
    },
    remainedTime: {
      type: Number,
      default: config.aliveDuration
    },
    status: {
      type: Boolean,
      default: false
    },
    owner: {
        type: Number,
        ref: "User"
      }
    
  })
  
  HeroSchema.plugin(timestamps)
  HeroSchema.plugin(autoIncrement.plugin, "Hero")
  
  const Hero = connection.model(
    "Hero",
    HeroSchema  
  );

  return Hero;
}
