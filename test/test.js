const fs = require('fs');
const truffleContract = require('@truffle/contract');
const truffleAssert = require('truffle-assertions');

const CONFIG = require("../credentials");
const { web3 } = require('hardhat');

const tokenABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/erc20.sol/Token.json', 'utf8'))).abi;
let routerABI = fs.readFileSync('./abi/router.abi').toString();
routerABI = JSON.parse(routerABI);
let factoryABI = fs.readFileSync('./abi/factory.abi').toString();
factoryABI = JSON.parse(factoryABI);

contract("Wrap Unwrap Test Cases", () => {
    let token;   
    let bnb; 
    let accounts;

    // let routerAdd = '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F';
    // let factoryAdd = "0xBCfCcbde45cE874adCB698cC183deBcF17952812";
    let routerAdd = '0x7a250d5630b4cf539739df2c5dacb4c659f2488d';
    let factoryAdd = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";

    // const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
    // const provider = new Web3.providers.HttpProvider(CONFIG.polygonTestnet.url);


    before(async () => {
        accounts = await web3.eth.getAccounts()

        const TOKEN = artifacts.require("Token");

        token = await TOKEN.new()
        TOKEN.setAsDeployed(token)
        token = await TOKEN.deployed()

        bnb = await TOKEN.new()
        TOKEN.setAsDeployed(bnb)
        bnb = await TOKEN.deployed()

        router = await ethers.getContractAt(routerABI, routerAdd);
        factory = await ethers.getContractAt(factoryABI, factoryAdd);


        console.log({
            bnb: bnb.address,
            token: token.address,
            router: router.address,
            factory: factory.address
        })

    })

    after(async () => {
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
        console.log('\u0007');
    })

    const advanceBlock = () => new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            id: new Date().getTime()
        }, async (err, result) => {
            if (err) { return reject(err) }
            // const newBlockHash =await web3.eth.getBlock('latest').hash
            return resolve()
        })
    })
    
    const advanceBlocks = async (num) => {
        let resp = []
        for (let i = 0; i < num; i += 1) {
            resp.push(advanceBlock())
        }
        await Promise.all(resp)
    }
    
    const advancetime = (time) => new Promise((resolve, reject) => {
        web3.currentProvider.send({ 
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            id: new Date().getTime(),
            params: [time]
        }, async (err, result) => {
            if (err) { return reject(err) }
            const newBlockHash = await web3.eth.getBlock('latest').hash
    
            return resolve(newBlockHash)
        })
    })

    const mintCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, provider);
        const estimateGas = await erc20.estimateGas.mint(address, number, "0x0000000000000000000000000000000000000000000000000000000000000000");
        return estimateGas;
    }

    const burnCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, provider);
        const estimateGas = await erc20.estimateGas.burn(address, number, "0x0000000000000000000000000000000000000000000000000000000000000000");
        return estimateGas;
    }

    it ("should be able to add liquidity", async () => {
        // await factory.createPair(token.address, bnb.address);
		// let pairAddress = await factory.getPair(token.address, bnb.address)
        // console.log({
        //     pairAddress,
        // })

        await token.approve(router.address, "100000000000000000000000000000000000")
        await bnb.approve(router.address, "10000000000000000000000000000000000")

        // 1 token = 0.01850304 usd
        // 1 bnb = 383.07 usd
        // 1 token = 0.000483019810000000 bnb
        await router.addLiquidity(token.address, bnb.address, "100000000000000000000000", "48301981000000000000", "1", "1", accounts[0], Date.now() + 10000000, { from: accounts[0] }); 
        const data = await router.getAmountsOut("1000000000000000000", [token.address, bnb.address])
        console.log({
            usdcAmount: data[1].toString()
        })
    })

    it ("should mint tokens, when called by admin", async () => {
        const admin = accounts[0]
        const user = accounts[1]
        const amount = 100

        const balanceBef = await token.balanceOf(user)

        await token.mint(user, amount, "0x0000000000000000000000000000000000000000000000000000000000000001", {from: admin})
        await truffleAssert.reverts(token.mint(user, amount, "0x0000000000000000000000000000000000000000000000000000000000000002", {from: user}))

        const balanceAft = await token.balanceOf(user)
        
        assert.equal(balanceBef.toNumber(), 0, "Balance before is not equal to 0")
        assert.equal(balanceAft.toNumber(), amount, "Balance after is not equal to amount")
    })

    it ("should burn tokens, when called by admin", async () => {
        const admin = accounts[0]
        const user = accounts[1]
        const amount = 100

        const balanceBef = await token.balanceOf(user)

        await token.burn(user, amount, "0x0000000000000000000000000000000000000000000000000000000000000003", {from: admin})
        await truffleAssert.reverts(token.burn(user, amount, "0x0000000000000000000000000000000000000000000000000000000000000003", {from: user}))

        const balanceAft = await token.balanceOf(user)
        
        assert.equal(balanceAft.toNumber(), 0, "Balance after is not equal to 0")
        assert.equal(balanceBef.toNumber() - balanceAft.toNumber(), amount, "Burn amount not correct")
    })

    it ("should estimate gas", async () => {
        const admin = accounts[0]

        await mintCost(token, accounts[0], 100)
        await token.mint(accounts[0], 100, "0x0000000000000000000000000000000000000000000000000000000000000004", {from: admin})

        await burnCost(token, accounts[0], 100)
        await token.burn(accounts[0], 100, "0x0000000000000000000000000000000000000000000000000000000000000005", {from: admin})

        await mintCost(token, accounts[1], 100000000000)
        await token.mint(accounts[1], 100000000000, "0x0000000000000000000000000000000000000000000000000000000000000006", {from: admin})

        await mintCost(token, accounts[2], 1000)
        await token.mint(accounts[2], 1000, "0x0000000000000000000000000000000000000000000000000000000000000007", {from: admin})

        await burnCost(token, accounts[1], 50000000000)
        await token.burn(accounts[1], 50000000000, "0x0000000000000000000000000000000000000000000000000000000000000008", {from: admin})

        await burnCost(token, accounts[2], 500)
        await token.burn(accounts[2], 500, "0x0000000000000000000000000000000000000000000000000000000000000009", {from: admin})
        
    })

})