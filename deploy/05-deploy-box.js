const { network, ethers } = require("hardhat");
const {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS;
    const args = [];
    log("-----------------------------------");
    const box = await deploy("Box", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: waitBlockConfirmations,
    });
    log(`Box at ${box.address}`);
    log("-----------------------------------");

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying ...");
        await verify(box.address, []);
    }

    const boxContract = await ethers.getContractAt("Box", box.address);
    const timeLock = await ethers.getContract("TimeLock");
    const transferTx = await boxContract.transferOwnership(timeLock.address);
    await transferTx.wait(1);
    log("Ownership transfered to timeLock !");
};

module.exports.tags = ["all", "box"];
