import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Web3 from "web3";
import crowdfundingSol from "./Crowdfunding.sol"; // Import the Solidity contract
import * as solc from "solc";

export default function App() {
  const [web3, setWeb3] = useState(null);
  const [crowdfundingContract, setCrowdfundingContract] = useState(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Create a Web3 instance and connect to Sepolia testnet provider
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3("https://rpc.testnet.sep.io");
        setWeb3(web3Instance);
      } else {
        setError(
          "No Ethereum provider found. Please install MetaMask or other compatible wallet."
        );
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    // Deploy the contract
    const deployContract = async () => {
      try {
        if (web3) {
          const accounts = await web3.eth.getAccounts();
          const input = {
            language: "Solidity",
            sources: {
              "Crowdfunding.sol": {
                content: crowdfundingSol
              }
            },
            settings: {
              outputSelection: {
                "*": {
                  "*": ["abi", "evm.bytecode.object"]
                }
              }
            }
          };
          const compiledContract = JSON.parse(
            solc.compile(JSON.stringify(input))
          );
          const abi = compiledContract.contracts["Crowdfunding.sol"].abi;
          const bytecode =
            "0x" +
            compiledContract.contracts["Crowdfunding.sol"].evm.bytecode.object;
          const Contract = new web3.eth.Contract(abi);
          const deployTransaction = Contract.deploy({
            data: bytecode,
            arguments: []
          });
          const estimatedGas = await deployTransaction.estimateGas();
          const gasPrice = await web3.eth.getGasPrice();
          const options = {
            from: accounts[0],
            gas: estimatedGas,
            gasPrice: gasPrice
          };
          const deployedContract = await deployTransaction.send(options);
          setCrowdfundingContract(deployedContract);
        }
      } catch (err) {
        setError("Failed to deploy crowdfunding contract. Please try again.");
      }
    };

    deployContract();
  }, [web3]);

  const handleContribute = async () => {
    setError("");
    if (!web3 || !crowdfundingContract || !contributionAmount) {
      setError(
        "Please connect to Ethereum provider and wait for contract deployment."
      );
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const contributionWei = web3.utils.toWei(contributionAmount, "ether");
      const transaction = await crowdfundingContract.methods.contribute().send({
        from: accounts[0],
        value: contributionWei
      });
      setTransactionHash(transaction.transactionHash);
    } catch (err) {
      setError("Failed to contribute. Please check your wallet and try again.");
    }
  };

  // Add event listener for "CampaignFunded" event
  useEffect(() => {
    if (crowdfundingContract) {
      crowdfundingContract.events
        .CampaignFunded()
        .on("data", (event) => {
          console.log("CampaignFunded event data:", event);
        })
        .on("error", (error) => {
          console.error("CampaignFunded event error:", error);
        });
    }
  }, [crowdfundingContract]);

  return (
    <div className="App">
      <h1>Crowdfunding App</h1>
      <p>
        Contract Address:{" "}
        {crowdfundingContract ? crowdfundingContract.options.address : "N/A"}
      </p>
      <input
        type="number"
        step="0.01"
        placeholder="Enter contribution amount"
        value={contributionAmount}
        onChange={(e) => setContributionAmount(e.target.value)}
      />
      <button onClick={handleContribute}>Contribute</button>
      {transactionHash && (
        <p>
          Transaction Hash:{" "}
          <a
            href={`https://explorer.sep.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {transactionHash}
          </a>
        </p>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
