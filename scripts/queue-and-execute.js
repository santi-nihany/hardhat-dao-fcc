const { ethers, network } = require("hardhat");
const {
    NEW_STORE_VALUE,
    FUNC,
    PROPOSAL_DESCRIPTION,
    MIN_DELAY,
    developmentChains,
} = require("../helper-hardhat-config");
const { moveBlocks } = require("../utils/move-blocks");
const { moveTime } = require("../utils/move-time");

async function queueAndExecute(args, functionToCall, proposalDescription) {
    //contracts
    const governor = await ethers.getContract("GovernorContract");
    const box = await ethers.getContract("Box");

    const encodedFunctionCall = box.interface.encodeFunctionData(functionToCall, args);

    const targets = [box.address];
    const values = [0];
    const calldatas = [encodedFunctionCall];
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalDescription));

    console.log("Queueing...");
    const queueTx = await governor.queue(targets, values, calldatas, descriptionHash);
    await queueTx.wait(1);

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1);
    }

    console.log("Executing...");
    // this will fail on a testnet because you need to wait for the MIN_DELAY!
    const executeTx = await governor.execute(targets, values, calldatas, descriptionHash);
    await executeTx.wait(1);
    console.log("Executed!!");

    const boxNewValue = await box.retrieve();
    console.log(`New Box Value: ${boxNewValue.toString()}`);
}

queueAndExecute([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
