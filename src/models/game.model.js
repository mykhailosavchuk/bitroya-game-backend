const mongoose = require("mongoose");
const timestamps = require('mongoose-unix-timestamp-plugin');


module.exports = (connection, autoIncrement) => {

  const GameSchema = new mongoose.Schema({
    result: {
      type: String,
      enum: ["Win", "Loss", "Error", "Playing"],
    },
    user: {
      type: Number,
      ref: "User",
    },
    heros: [{
      type: Number,
      ref: "Hero",
    }],
    token: {
      type: Number,
      ref: "Token"
    }
  });
  
  GameSchema.plugin(timestamps);
  GameSchema.plugin(autoIncrement.plugin, "Game")  

  const Game = connection.model(
    "Game",
    GameSchema
  );

  return Game;
}