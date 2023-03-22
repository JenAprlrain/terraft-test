import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Web3 from "web3";
import './App.js';
import './App.css';
import planet1 from './images/planet1.png';
import console from './images/console.gif';
import NFTABI from './contracts/NFTABI.json';
import Logo1 from './images/Planet Rymoth.png';

function StakingPage() {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [tokenContract, setTokenContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [lastClaimedBlock, setLastClaimedBlock] = useState(0);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [nftContract, setNftContract] = useState(null);
  const [userNFTs, setUserNFTs] = useState([]);
  const [totalRareAlienNFTsEmitted, setTotalRareAlienNFTsEmitted] = useState(0);
  const [nftImages, setNFTImages] = useState([]);



  const NFTAddress = "0xE6658Ec41bEf9965FD69F193fB8FDe7E31408681";
  const stakingAddress = "STAKING_ADDRESS_HERE";
  const stakingABI = "";
  const ZonkABI = "";
  const tokenAddress = "";

  useEffect(() => {
    async function setupWeb3() {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
      setWeb3(web3);
      const accounts = await web3.eth.getAccounts();
      setAccounts(accounts);
      const nftContract = new web3.eth.Contract(NFTABI, NFTAddress);
      setNftContract(nftContract);
      const tokenContract = new web3.eth.Contract(ZonkABI, tokenAddress);
      setTokenContract(tokenContract);
      const stakingContract = new web3.eth.Contract(stakingABI, stakingAddress);
      setStakingContract(stakingContract);
      const userNFTs = await nftContract.methods.WalletOfOwner(accounts[0]).call();
      setUserNFTs(userNFTs);
    }
  
    setupWeb3();
  }, []);

  useEffect(() => {
    async function updateStakedNFTs() {
      if (web3 && accounts.length > 0 && stakingContract) {
        const stakedNFTs = await stakingContract.methods.stakedNFTs(accounts[0]).call();
        setStakedNFTs(stakedNFTs);
      }
    }

    updateStakedNFTs();
  }, [web3, accounts, stakingContract]);

  useEffect(() => {
    async function updateRewardAmount() {
      if (web3 && accounts.length > 0 && stakingContract) {
        const totalStaked = await stakingContract.methods.getTotalStaked().call();
        const emissionRate = await stakingContract.methods.emissionRate().call();
        const rewardAmount = (stakedNFTs.length * emissionRate) / 10 ** 18;
        setRewardAmount(rewardAmount);
      }
    }

    updateRewardAmount();
  }, [web3, accounts, stakingContract, stakedNFTs]);

  useEffect(() => {
    async function updateLastClaimedBlock() {
      if (web3 && accounts.length > 0 && stakingContract) {
        const lastClaimedBlock = await stakingContract.methods.lastClaimedBlock(accounts[0]).call();
        const block = await web3.eth.getBlock(lastClaimedBlock);
        const date = new Date(block.timestamp * 1000);
        setLastClaimedBlock(date.toLocaleString());
      }
    }
  
    updateLastClaimedBlock();
  }, [web3, accounts, stakingContract]);

  async function handleClaim() {
    if (stakingContract) {
      const claimResult = await stakingContract.methods.claim().send({ from: accounts[0] });
      console.log(claimResult);
      setLastClaimedBlock(await web3.eth.getBlockNumber());
    }
  }

  async function handleConnectWallet() {
    const web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    setWeb3(web3);
  }

  async function handleStake(nftID) {
    if (stakingContract) {
      const approveResult = await tokenContract.methods.approve(stakingAddress, nftID).send({ from: accounts[0] });
      const stakeResult = await stakingContract.methods.stake(nftID).send({ from: accounts[0] });
      console.log(approveResult);
      console.log(stakeResult);
      setStakedNFTs([...stakedNFTs, nftID]);
    }
  }

  async function handleUnstake(nftID) {
    if (stakingContract) {
      const unstakeResult = await stakingContract.methods.unstake(nftID).send({ from: accounts[0] });
      console.log(unstakeResult);
      const updatedNFTs = stakedNFTs.filter(id => id !== nftID);
      setStakedNFTs(updatedNFTs);
    }
  }
  
  useEffect(() => {
    async function updateNFTs() {
      if (web3 && accounts.length > 0) {
        const userAddress = accounts[0];
        const userNFTs = await nftContract.methods.walletOfOwner(userAddress).call();
        setUserNFTs(userNFTs);
      }
    }
  
    updateNFTs();
  }, [web3, accounts, nftContract, setUserNFTs]);

  async function updateNFTImages() {
    if (web3 && accounts.length > 0 && nftContract) {
      const promises = userNFTs.map(async (nftID) => {
        const tokenURI = await nftContract.methods.tokenURI(nftID).call();
        const response = await fetch(`https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`);
        const data = await response.json();
        return { id: nftID, name: data.name, image: `https://ipfs.io/ipfs/${data.image.replace("ipfs://", "")}` };
      });
  
      const nftImages = await Promise.all(promises);
      setNFTImages(nftImages);
    }
  }
  
  useEffect(() => {
    async function fetchData() {
      await updateNFTImages();
    }
    fetchData();
  }, [userNFTs]);
  
  
  useEffect(() => {
    async function updateTotalRareAlienNFTsEmitted() {
      if (web3 && stakingContract) {
        const totalRareAlienNFTsEmitted = await stakingContract.methods.getRareAlienNFTsEmitted().call();
        setTotalRareAlienNFTsEmitted(totalRareAlienNFTsEmitted);
      }
    }

    updateTotalRareAlienNFTsEmitted();
  }, [web3, stakingContract]);

  const navigate = useNavigate();

  const handleNFTCardClick = (nftId) => {
    if (selectedNFT === nftId) {
      setSelectedNFT("");
    } else {
      setSelectedNFT(nftId);
    }
  };
  
  
  return (
    <div className="staking-page">
      <img className= "planet1logo" src={Logo1} alt="Planet1 Logo" />
      <div className= "reward-info">
      <h2>Planet Rewards</h2>
      <p>1x $ZONK</p>
      <p>20% chance to recieve a Rare Alien NFT</p>
      <p>10% chance to recieve a Land NFT</p>
      </div>
      <div className= "back-to-base">
      <button className= "base-button" style={{ position: "absolute", top: "3px", left: "30px" }} onClick={() => navigate("/")}>Back to Base</button>
      </div>
      <img className="planet1" src={planet1} alt="Planet 1" />
      <div style={{position: 'relative'}}>
        <img src={console} alt="console" style={{ width: '30%', height: '30%', padding: '20px 0', marginTop: '60px' }}/>
        <div className="staking-container">
          <div className="stake-info">
            <p>Your staked Aliens: {stakedNFTs.length > 0 ? stakedNFTs.join(", ") : "None"}</p>
            <p>Total Mined: {rewardAmount} $ZONK</p>
            <p>Rare Alien NFTs rewarded: {totalRareAlienNFTsEmitted}</p>
            <p>Last claimed: {lastClaimedBlock}</p>
          </div>
          <div className="stake-buttons">
            {accounts.length > 0 ? (
              <>
                <button onClick={() => handleStake(selectedNFT)}>Stake selected Aliens</button>
                <button onClick={() => handleUnstake(selectedNFT)}>Unstake selected Aliens</button>
              </>
            ) : (
              <button onClick={() => handleConnectWallet()}>Connect wallet</button>
            )}
          </div>
        </div>
        <div className="claim-rewards">
          <button onClick={() => handleClaim()}>Claim rewards</button>
        </div>
        <div className="nft-container">
          <div className="inventory-title">Inventory</div>
          {nftImages.map((nft) => (
            <div className={stakedNFTs.includes(nft.id) ? "nft-card staked" : "nft-card"} key={nft.id} onClick={() => handleNFTCardClick(nft.id)}>
              <img className="nft-image" src={nft.image} alt="NFT" />
              <div className="nft-name">{nft.name}</div>
              {stakedNFTs.includes(nft.id) && <div className="staked-overlay">STAKED</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
      }
      export default StakingPage;