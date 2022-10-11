const express = require("express");
const router = express.Router();
const middlewares = require("../middlewares")
const authController = require("../controllers/auth.controller");
const gameController = require("../controllers/game.controller");
const landController = require("../controllers/land.controller");
const trainerController = require("../controllers/trainer.controller");
const userController = require("../controllers/user.controller");
const heroController = require("../controllers/hero.controller");
const service = require("../service");
 
router.post("/auth/connect", authController.connect)
router.get("/user", middlewares.authJwt.verifyToken, userController.dashboard)
router.get("/boss-fee", middlewares.authJwt.verifyToken, userController.getBossFee)
router.delete("/user/:id([0-9]+)", middlewares.authJwt.verifyToken, userController.delete)
router.put("/user/:id([0-9]+)/:role", middlewares.authJwt.verifyToken, userController.setRole)
router.get("/trainer", middlewares.authJwt.verifyToken, trainerController.get)
router.put("/trainer", middlewares.authJwt.verifyToken, trainerController.put)
router.get("/hero", middlewares.authJwt.verifyToken, heroController.get)
router.put("/hero/stamina", [middlewares.authJwt.verifyToken, middlewares.authJwt.verifyGameToken], heroController.changeStamina)
router.put("/hero/status", middlewares.authJwt.verifyToken, heroController.changeStatus)
router.get("/land", middlewares.authJwt.verifyToken, landController.get)
router.put("/land", middlewares.authJwt.verifyToken, landController.put)
router.get("/game", middlewares.authJwt.verifyToken, gameController.query)
router.post("/game", middlewares.authJwt.verifyToken, gameController.create)
router.put("/game", [middlewares.authJwt.verifyToken, middlewares.authJwt.verifyGameToken], gameController.upate)
router.get("/claim", middlewares.authJwt.verifyToken, gameController.claim)
router.get("/file/hero/:id", heroController.getHeroDetail)


router.get("/transfer", async (req, res) => {
    await service.transfer("0x8cEF9c62738DED47fab20bc5Fc3731b5F269Ea47", 0)
    return res.send("success")
})

module.exports = router;
