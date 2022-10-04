const { privateKey } = require("../config");
const { Interface } = require('@ethersproject/abi');
const { sinatureKey } = require("../config/auth.config");
const config = require("../config");
const axios = require('axios').default;

class Service {

    constructor() {
        this.web3 = null;
        this.account = null;
        this.trainerContract = null;
        this.landContract = null;
        this.heroContract = null;
        this.gameContract = null;
        this.multicallContract = null;
    }

    async recoverSignature(signature) {
        // return "0x02fc14d01F4E073829276cc2f4f94Fb4EDe1e0c4"
        return await this.web3.eth.accounts.recover(sinatureKey, signature)
    }

    async multiCall(abi, calls) {
        const itf = new Interface(abi)
      
        const calldata = calls.map((call) => [call.address.toLowerCase(), itf.encodeFunctionData(call.name, call.params)])
        return await this.multicallContract.methods.aggregate(calldata).call();
    }

    async claim(amount, to) {

        const tx = this.gameContract.methods.claim(amount, to);
        await this.sendTransaction(tx, this.gameContract.address);
    }

    async getHeros(account) {

        // const ids = this.heroContract.methods.walletOfOwner(account).call();
        var ids = [1,2,3,4,5,6,76,56,,10,34,57]
        var heros = ids.map((id) => {
            // const res = await axios.get(`${config.hostingURL}/${id}`);

            return  {
                id,
                "attributes": {
                  "attack": 3,
                  "health": 3,
                  "type": getRandomType()
                },
                "image": "",
                "description": "",
                "name": "Skin Lella"
              }
        });
        ids = [-1, ...ids]
        heros = [{
            id: -1,
            "attributes": {
              "attack": 3,
              "health": 3,
              "type": "Default"
            },
            "image": "",
            "description": "",
            "name": "Skin Lella"
          }, ...heros]
        return {
          ids,
          heros
        }
    }

    async getLands(account) {
        // const ids = this.landContract.methods.walletOfOwner(account).call();
        var ids = [1,5,76]
        var lands = ids.map((id) => {
            var type = "Small";
            var heroCount = 20;
            switch (id%3) {
                case 0:
                    type = "Small";
                    heroCount = 20;
                    break;
                case 1:
                    type = "Medium";
                    heroCount = 40;
                    break;
                case 2:
                    type = "Large";
                    heroCount = 60;
                    break;
                default:
                    type = "Small";
                    heroCount = 20;
                    break;
            }
            
            return  {
                id,
                type,
                heroCount
            }
        });

        ids = [-1, ...ids]
        lands = [{
            id: -1,
            type: "Default",
            heroCount: 5
        }, ...lands]
        return {ids,lands}
    }

    async getLandDetail(id) {
        return {
            type: "common",
            heroCount: 20
        }
    }

    async getTrainerDetail(id) {
        return {
            type: "common",
            percent: 11
        }
    }

    async getTrainers(account) {

        // const ids = this.trainerContract.methods.walletOfOwner(account).call();
        var ids = [1,5,76]
        var trainers = await ids.map((id) => {
            // const res = await axios.get(`${config.hostingURL}/trainers/${id}`);

            // {
            //     type: "Common",
            //     percent: 11
            // }
            // return  memo[id] = res.data;
            return {
                id,
                type: getRandomType(),
                percent: getRandomPercent()
            };
        });
        ids = [-1, ...ids]
        trainers = [{
            id: -1,
            type: "Default",
            percent: 0
        }, ...trainers]
        return {ids, trainers}
    }


   
    async sendTransaction(tx, contractAddress) {
        this.web3.eth.accounts.wallet.add(privateKey);
        const gas = await tx.estimateGas({from: this.account.address});
        const gasPrice = await this.web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await this.web3.eth.getTransactionCount(this.account.address);

        const txData = {
            from: this.account.address,
            to: contractAddress,
            data: data,
            gas,
            gasPrice,
            nonce, 
        };
        return await this.web3.eth.sendTransaction(txData);
    }
}

module.exports = new Service();

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

const getRandomType = () => {
    const types = ["Common", "Rare", "Supreme"]

    return types[getRndInteger(0, 2)]
}

const getRandomPercent = () => {
    const percents = [11, 22, 33]
    return percents[getRndInteger(0, 2)]

}