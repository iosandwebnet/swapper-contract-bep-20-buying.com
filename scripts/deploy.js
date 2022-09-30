const fs = require('fs');
const truffleContract = require('@truffle/contract');
const truffleAssert = require('truffle-assertions');

const CONFIG = require("../credentials");
const { web3, ethers } = require('hardhat');

const tokenABI = (JSON.parse(fs.readFileSync('./artifacts/contracts/erc20.sol/Token.json', 'utf8'))).abi;
let routerABI = fs.readFileSync('./abi/router.abi').toString();
routerABI = JSON.parse(routerABI);

const ownerAccount = "0xec3C325403180D300D597B3c89897F753E660C52"

contract("Wrap unwrap token Test Cases", () => {
    let token;    
    let bnb;

    let routerAdd = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3';
    let bnbAdd = '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3'
    // let factoryAdd = "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f";

    // const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
    // const web3 = new Web3.providers.HttpProvider(CONFIG.infura.bscTestnet);
    // const provider = new ethers.providers.JsonRpcProvider("https://data-seed-prebsc-1-s1.binance.org:8545/");
    const provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
    const signer = new ethers.Wallet(CONFIG.wallet.PKEY);
    const account = signer.connect(provider);
    

    before(async () => {

        const TOKEN = artifacts.require("Token");

        token = await TOKEN.new()
        TOKEN.setAsDeployed(token)
        token = await TOKEN.deployed()

        // bnb = await TOKEN.new()
        // TOKEN.setAsDeployed(bnb)
        // bnb = await TOKEN.deployed()

        token = new ethers.Contract(token.address, tokenABI, account);
        // bnb = new ethers.Contract(bnb.address, tokenABI, account);
        // bnb = await ethers.getContractAt(bnbAdd, tokenABI, account);
        // router = await ethers.getContractAt(routerABI, routerAdd, account);
        // factory = await ethers.getContractAt(factoryABI, factoryAdd, account);

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

    const sendBNBTForMint = async (token, admin, address, number) => {
        gas = await mintCost(token, address, number);
        gasPrice = await provider.getGasPrice();

        console.log({
            gas: String(gas),
            gasPrice: String(gasPrice),
        })

        estimatedPrice = gas * gasPrice * 2;
        let tx = await account.sendTransaction({ to: admin, value: estimatedPrice })
        await tx.wait()
    }

    const sendBNBTForBurn = async (token, admin, address, number) => {
        gas = await burnCost(token, address, number);
        gasPrice = await provider.getGasPrice();

        console.log({
            gas: String(gas),
            gasPrice: String(gasPrice),
        })

        estimatedPrice = gas * gasPrice * 2;
        let tx = await account.sendTransaction({ to: admin, value: estimatedPrice })
        await tx.wait()
}

    const mintCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, account);
        const estimateGas = await erc20.estimateGas.mint(address, number, "0x0000000000000000000000000000000000000000000000000000000000000000");
        return estimateGas;
    }

    const burnCost = async (token, address, number) => {
        const erc20 = new ethers.Contract(token.address, tokenABI, account);
        const estimateGas = await erc20.estimateGas.burn(address, number, "0x0000000000000000000000000000000000000000000000000000000000000000");
        return estimateGas;
    }

    it ("should print contract address", async () => {
        console.log({
            token: token.address,
        })
    })

    // it ("should provide liquidity", async () => {
    //     let tx = await token.approve(router.address, "100000000000000000000000000000")
    //     await tx.wait()
    //     tx = await bnb.approve(router.address, "100000000000000000000000000000")
    //     await tx.wait()
    //     tx = await router.addLiquidity(token.address, bnb.address, "1000000000000000000000000000", "200000000000000000000000000", "1", "1", account.address, Date.now() + 10000000); 
    //     await tx.wait()
    // })


    // it ("should be able to mint token", async () => {
    //     // await sendBNBTForMint(token, account.address, "0x0000000000000000000000000000000000000002", 100);
    //     let tx = await token.mint("0x0000000000000000000000000000000000000002", 100, "0x0000000000000000000000000000000000000000000000000000000000000000");
    //     await tx.wait()
    // })

    // it ("should be able to burn token", async () => {
    //     // await sendBNBTForBurn(token, account.address, "0x0000000000000000000000000000000000000002", 50);
    //     let tx = await token.burn("0x0000000000000000000000000000000000000002", 50, "0x0000000000000000000000000000000000000000000000000000000000000001");
    //     await tx.wait()
    // })

    it ("should transfer ownership", async () => {
        let tx = await token.transferOwnership(ownerAccount)
        await tx.wait()
    })


    // it ("should be able to get gas estimate and price", async () => {
    //     const estGasMint = await mintCost(token, "0x0000000000000000000000000000000000000002", 100);
    //     const estGasBurn = await burnCost(token, "0x0000000000000000000000000000000000000002", 50);
    // })
})
