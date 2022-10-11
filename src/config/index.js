module.exports = {
	gameContractAddr: "0x0c7aF3626e1088eC81290723c84C11E432B4eD9b",
	trainerContractAddr: "0x01fe5FB8f8E58B7A19116A2de65C2156A5135f51",
	landContractAddr: "0xf8392864ba72292A21cfb59147A45e92C7f83e9d",
	heroContractAddr: "0x1eD3E0821231395Fd158b702171f19B93e3f8908",
	multicallContractAddr: "0x6e5BB1a5Ad6F68A8D7D6A5e47750eC15773d6042",
	gameContractAddr: "0x0c7aF3626e1088eC81290723c84C11E432B4eD9b",
	privateKey: "6b6be15e6c438d00de6af9c85a7d6da449f1d78ce31bc6639242985ade26445f",
	hostingURL: "http://localhost:8080",
	awardAmount: 0.1 * Math.pow(10, 18),
	minClaimAmount: 1 * Math.pow(10, 18),
	// aliveDuration: 60 * 60 * 3 * 1000,
	// claimEnableDate: 60 * 60 * 24 * 20 * 1000,
	// day: 60 * 60 * 24 * 1000,
	aliveDuration: 3* 60 * 1000,
	claimEnableDate: 60 * 60 * 1000,
	day: 60 * 1000,
	heroCounts: {
		default: 5,
		small: 3,
		medium: 4,
		large: 5
	},
	SMALL: "small",
	MEDIUM: "medium",
	LARGE: "large",
	DEFAULT: "default",
	defaultLand: {
		id: -1,
		type: "default",
		heroCount: 5
	},
	defaultTrainer: {
		id: -1,
		type: "default",
		percent: 0,
	}
}