/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
 // require("solidity-coverage");
 
 // require('hardhat-spdx-license-identifier');
 // require("hardhat-gas-reporter");
 const CONFIG = require("./credentials.js");
 
 module.exports = {
     solidity: {
         compilers: [
             {
                 version: "0.8.0",
                 settings: {
                     optimizer: {
                         enabled: true,
                         runs: 1000,
                     },
                 },
             },
         ],
     },
     spdxLicenseIdentifier: {
         overwrite: true,
         runOnCompile: true,
     },
     // gasReporter: {
     //     currency: 'USD',
     //     gasPrice: 1
     // },
     defaultNetwork: "hardhat",
     mocha: {
         timeout: 1000000000000,
     },
 
     networks: {
         hardhat: {
             blockGasLimit: 10000000000000,
             allowUnlimitedContractSize: true,
             timeout: 1000000000000,
             accounts: {
                 accountsBalance: "100000000000000000000000",
                 count: 20,
             },
         },
         bscMainnet: {
            url: `https://bsc-dataseed.binance.org/`,
            accounts: [CONFIG.wallet.PKEY],
        },
         bscTestnet: {
             url: `https://data-seed-prebsc-1-s1.binance.org:8545/`,
             accounts: [CONFIG.wallet.PKEY],
         },
         mainnet: {
            url: "https://mainnet.infura.io/v3/7431868d5d1d49e99286e1f59569a0e0",
            accounts: [CONFIG.wallet.PKEY],
         }
     },
 
     contractSizer: {
         alphaSort: false,
         runOnCompile: true,
         disambiguatePaths: false,
     },
     etherscan: {
        apiKey: `${CONFIG.etherscan.KEY}`
    }
 };
 