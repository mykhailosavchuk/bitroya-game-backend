const mongoose = require("mongoose");
var timestamps = require('mongoose-unix-timestamp-plugin');

module.exports = (connection, autoIncrement) => {

  const UserSchema = new mongoose.Schema({
    address: {
      type: String,
      unique: true,
    },
    enabled: {
      type: Boolean,
      default: false
    },
    awardAmount: {
      type: Number,
      default: 0
    },
    activedLandId: {
      type: Number,
      default: -1
    },
    activedTrainerId: {
      type: Number,
      default: -1
    },
    firstWinAt: {
      type: Number
    },
    isFirstWin: {
      type: Boolean,
      default: false
    },
    games: [
      {
        type: Number,
        ref: "Game"
      }
    ],
    roles: [
      {
        type: Number,
        ref: "Role"
      }
    ]
  })
  
  UserSchema.plugin(timestamps)
  UserSchema.plugin(autoIncrement.plugin, "User")
  
  const User = connection.model(
    "User",
    UserSchema  
  );

  return User;
}
