const { privateKey, trainerContractAddr, multicallContractAddr, landContractAddr, heroContractAddr, gameContractAddr } = require("../config");
const { Interface } = require('@ethersproject/abi');
const { sinatureKey } = require("../config/auth.config");
const config = require("../config");
const Web3 = require('web3');
const axios = require('axios').default;
const db = require("../models");
const User = db.user;
const Hero = db.hero;
const NFTContract = require("../blockchain/abis/ERC721.json")
const MulticallContract = require("../blockchain/abis/Multicall.json")
const fs = require("fs")

class Service {

    constructor() {
        this.web3 = null;
        this.account = null;
        this.trainerContract = null;
        this.landContract = null;
        this.heroContract = null;
        this.gameContract = null;
        this.multicallContract = null;

        const web3 = new Web3(new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545/'));
        const account = web3.eth.accounts.privateKeyToAccount(privateKey)

        this.web3 = web3;
        this.account = account;
        this.trainerContract = new web3.eth.Contract(NFTContract.abi, trainerContractAddr);
        this.landContract = new web3.eth.Contract(NFTContract.abi, landContractAddr);
        this.heroContract = new web3.eth.Contract(NFTContract.abi, heroContractAddr);
        this.multicallContract = new web3.eth.Contract(MulticallContract, multicallContractAddr);
        // this.gameContract = new web3.eth.Contract(GameContract.abi, gameContractAddr);
    }

    async recoverSignature(signature) {
        return await this.web3.eth.accounts.recover(sinatureKey, signature)
    }

    async multiCall(abi, calls) {
        const itf = new Interface(abi)

        const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])
        const { returnData } = await this.multicallContract.methods.aggregate(calldata).call();
        const res = returnData.map((call, i) => itf.decodeFunctionResult(calls[i].name, call))
    
        return res;
    }

    async claim(amount, to) {

        const tx = this.gameContract.methods.claim(amount, to);
        await this.sendTransaction(tx, this.gameContract.address);
    }

    async getHeros(account) {

        const user = await User.findOne({ address: account })
        const { lands } = await this.getLands(account);
        var selLand = lands.find(l => l.id == user.activedLandId);
        if(!selLand) {
            selLand = lands[0]
        }
        const count = await Hero.count({owner: user._id, status: true});
        if(selLand.heroCount < count) {
            await Hero.updateMany({owner: user._id, status: false});
        }
        const activedHeros = await Hero.find({ owner: user._id, status: true })
        var ids = await this.heroContract.methods.walletOfOwner(account).call();
        // var ids = [1, 2,3,45,6,7,8,9,90,23,33,44,55,66,77,88,99,11,12,222,333,444,5555,6666,777,888,7776,5544,3234,221]
        var heros = [] 
        for(let i=0 ; i<ids.length ; i++){
            const data = await this.readFile(ids[i])
            const res = {
                data
            }

            // const res = {
            //     data: {
            //         "attributes": {
            //             "attack": getRndInteger(1, 10),
            //             "health": getRndInteger(1, 10),
            //             "type": getRandomNFTType()
            //         },
            //         "image": "",
            //         "description": "",
            //         "name": getRandomName(),
            //     }
            // }

            const selHero = activedHeros.find(h => h.idHero == ids[i]);

            var actived = false;
            var stamina = 0
            var remainedTime = config.aliveDuration
            var enabledAt = 0
            if (selHero) {
                stamina = selHero.stamina
                remainedTime = selHero.remainedTime
                if (selHero.enabledAt + selHero.remainedTime <= Date.now() && selHero.stamina == 0) {
                    selHero.remainedTime = 0
                    selHero.stamina = 3;
                    selHero.enabledAt = Date.now()
                    await selHero.save();
                    stamina = 3;
                    remainedTime = 0
                } else if (selHero.stamina == 0) {
                    selHero.stamina = 0;
                    selHero.remainedTime = selHero.remainedTime - (Date.now() - selHero.enabledAt)
                    selHero.enabledAt = Date.now()
                    await selHero.save();
                    stamina = 0;
                    remainedTime = selHero.remainedTime - (Date.now() - selHero.enabledAt)
                }
                actived = true;
                enabledAt = selHero.enabledAt
            }

            heros.push({
                id: ids[i],
                name: res.data.name,
                image: res.data.image,
                description: res.data.description,
                royalty: res.data.attributes.type,
                attack: res.data.attributes.attack,
                health: res.data.attributes.health,
                stamina,
                remainedTime,
                enabledAt,
                actived
            })
        }

        ids = [-1, ...ids].map(id => id.toString())
        heros = [{
            id: -1,
            name: "KNC",
            image: "res.data.image",
            description: "res.data.description",
            royalty: 10,
            attack: 1,
            health: 10,
            stamina: 3,
            remainedTime: config.aliveDuration,
            actived: true
        }, ...heros]

        return {
            ids,
            heros
        }
    }

    async getLands(account) {
        var ids = await this.landContract.methods.walletOfOwner(account).call();
        const user = await User.findOne({ address: account })

        // var ids = [1, 5, 76]
        var lands = []
        for(let i=0 ; i<ids.length ; i++){
            var type = config.SMALL;
            var heroCount = 20;
            switch (ids[i] % 3) {
                case 0:
                    type = config.SMALL;
                    heroCount = config.heroCounts.small;
                    break;
                case 1:
                    type = config.MEDIUM;
                    heroCount = config.heroCounts.medium;
                    break;
                case 2:
                    type = config.LARGE;
                    heroCount = config.heroCounts.large;
                    break;
                default:
                    type = config.DEFAULT;
                    heroCount = config.heroCounts.default;
                    break;
            }
            let actived = false;
            if (ids[i] == user.activedLandId) {
                actived = true
            }
            lands.push({
                id: ids[i],
                type,
                heroCount,
                actived
            })
        };

        var actived = false;
        ids = [-1, ...ids].map(id => id.toString())
        if(!ids.includes(user.activedLandId.toString())) {
            actived = true;
        }
        lands = [{
            ...config.defaultLand,
            actived
        }, ...lands]
        return { ids, lands }
    }

    async getTrainers(account) {
        const user = await User.findOne({ address: account })
        var ids = await this.trainerContract.methods.walletOfOwner(account).call();
        // var ids = [1, 5, 76]
        var trainers = []
        for(let i=0 ; i<ids.length ; i++){
            // const res = await axios.get(`${config.hostingURL}/trainers/${ids[i]}`);

            // {
            //     type: "Common",
            //     percent: 11
            // }
            let actived = false;
            if (ids[i] == user.activedTrainerId) {
                actived = true
            }

            trainers.push({
                id: ids[i],
                type: getRandomTrainerType(),
                percent: getRandomPercent(),
                actived
            })
        }
        ids = [-1, ...ids].map(id => id.toString())
        var actived = false
        if(!ids.includes(user.activedTrainerId.toString())) {
            actived = true;
        }
        trainers = [{
            ...config.defaultTrainer,
            actived
        }, ...trainers]
        return { ids, trainers }
    }

    checkToken(_token, _xToken){
        var key = 1;
        for (var i = 0; i < _token.length; i++) {
            key += _token[i].charCodeAt(0);
        }
    
        key = key * 1024;
    
        return key == Number(_xToken);
    }

    async getHeroDetail(id) {
        const data = await this.readFile(id)
        const res = {
            data
        }
        const selHero = await Hero.findOne({_id: id});
        var actived = false;
        var stamina = 0
        var remainedTime = config.aliveDuration
        var enabledAt = 0
        if (selHero) {
            stamina = selHero.stamina
            remainedTime = selHero.remainedTime
            if (selHero.enabledAt + selHero.remainedTime <= Date.now() && selHero.stamina == 0) {
                selHero.remainedTime = 0
                selHero.stamina = 3;
                selHero.enabledAt = Date.now()
                await selHero.save();
                stamina = 3;
                remainedTime = 0
            } else if (selHero.stamina == 0) {
                selHero.stamina = 0;
                selHero.remainedTime = selHero.remainedTime - (Date.now() - selHero.enabledAt)
                selHero.enabledAt = Date.now()
                await selHero.save();
                stamina = 0;
                remainedTime = selHero.remainedTime - (Date.now() - selHero.enabledAt)
            }
            actived = true;
            enabledAt = selHero.enabledAt
        }

        return {
            id,
            name: res.data.name,
            image: res.data.image,
            description: res.data.description,
            royalty: res.data.attributes.type,
            attack: res.data.attributes.attack,
            health: res.data.attributes.health,
            stamina,
            remainedTime,
            enabledAt,
            actived
        }
    }

    async getTrainerDetail(id) {
        // const res = await axios.get(`${config.hostingURL}/trainers/${id}`);

        if(id == -1) {
            return config.defaultTrainer
        }
        return {
            type: "common",
            percent: 11
        }
    }

    async mint(to, count, price) {
        const tx = this.heroContract.methods.mint(to, count, price);
        await this.sendTransaction(tx, this.heroContract.address);
    }

    async transfer(to, id) {
        var tx = this.trainerContract.methods.approve(to, id);
        await this.sendTransaction(tx, this.trainerContract.address);
        tx = this.trainerContract.methods.transferFrom(this.account.address, to, id);
        await this.sendTransaction(tx, this.trainerContract.address);
    }
    
    async readFile(id) {
        var rawdata = {
            "attributes": {
            "attack": 1,
            "health": 3,
            "type": "COMMUN"
            },
            "image": "",
            "description": "",
            "name": "Skin goblin"
        };
        try {
        rawdata = JSON.parse(fs.readFileSync(`./src/files/heros/${id}.json`));
        }catch (err){console.log(err)}
        return rawdata;
    }

    async sendTransaction(tx, contractAddress) {
        this.web3.eth.accounts.wallet.add(privateKey);
        const gas = await tx.estimateGas({ from: this.account.address });
        const gasPrice = await this.web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await this.web3.eth.getTransactionCount(this.account.address);

        const txData = {
            from: this.account.address,
            to: contractAddress,
            data: data,
            gas: gas * 2,
            gasPrice,
            nonce,
        };
        return await this.web3.eth.sendTransaction(txData);
    }
}

module.exports = new Service();

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const getRandomNFTType = () => {
    const types = ["COMMUN", "UNCOMMUN", "SUPREME", "MYTHICAL", "RARE"];

    return types[getRndInteger(0, 4)]
}

const getRandomTrainerType = () => {
    const types = ["COMMUN", "RARE", "SUPREME"];

    return types[getRndInteger(0, 2)]
}

const getRandomPercent = () => {
    const percents = [11, 22, 33]
    return percents[getRndInteger(0, 2)]
}

const getRandomName = () => {
    const alphas = [
        "Skin alien",
        "Skin archer princess",
        "Skin archer",
        "Skin fairy",
        "Skin goblin",
        "Skin hunter",
        "Skin indian",
        "Skin knight",
        "Skin Lella",
        "Skin lumberjack",
        "Skin mage",
        "Skin monkey",
        "Skin ninja",
        "Skin ogre",
        "Skin pirate",
        "Skin robot",
        "Skin skeleton",
        "Skin turtle",
        "Skin warrior",
        "Skin witch",
    ];

    return alphas[getRndInteger(0, 19)];
}
