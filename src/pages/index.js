"use client";
import styles from './styles.module.css';
import React, { useEffect, useRef, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal } from "starknetkit";
import Link from 'next/link';
import { WalletAccount, Contract } from 'starknet'
const permissionManagerABI = require('./PermissionManagerABI.json');




function Home() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const [walletAccount, setWalletAccount] = useState(null);

  const contractAddress = '0x06462c81a901843c8f6ac3245e390abb3edf2f5b49be0446b13cd6ebb0a25fdb'
  

  const connectWallet = async () => {
    const { starknetkitConnectModal } = useStarknetkitConnectModal({
      connectors: connectors
    })

    const { connector } = await starknetkitConnectModal()
    await connect({ connector })

    const account = new WalletAccount(
      { nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7' },
      connector
    );
    setWalletAccount(account)
    const bl = await account.getBlockNumber();
    console.log(bl)
  }

  const handleTransaction = async () => {
  
    const calls = [
      {
        contractAddress: contractAddress,
        entrypoint: "grant_permission",
        calldata: [address]
      }
    ];

    const result = await walletAccount.execute(calls);
  

    console.log(result)
  };

  const oku2 = async () => {
    const lendContract = new Contract(permissionManagerABI.abi, contractAddress, walletAccount);

    const result = await lendContract.get_all_grantees("0x0499c2751d3691af78A4e85AFdbad1eb213FBD0B28F924ED60101C5c996c361E");


    const hasPermission = result[0] === 1n;

    
    console.log(result)
  };


  return (
    <>
      <main className={styles.main}>
        <div className={styles.description}>
          <div className={styles.logoContainer}>
            <img
              src="https://starknetkit-website-f0ejy1m72-argentlabs.vercel.app/starknetKit-logo-white.svg"
              alt="starknetkit logo"
            />
            <span>P2P File Transfer With Starknet</span>
            </div>
        </div>

        <div className="flex h-[80vh] items-center justify-center px-4">
          <Link href="/send" className="flex-1 max-w-2xl px-8 min-h-0 aspect-square">
            <div className="bg-white/5 backdrop-blur-sm p-16 rounded-3xl text-white text-center border border-white/10 hover:scale-105 transition-transform h-full">
              <div className="w-40 h-40 mx-auto mb-8 relative"> {/* icon boyutları artırıldı */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-28 h-28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-6">Send File</h2>
              <p className="text-gray-400 text-lg">
              Click for secure and fast file sharing
              </p>
            </div>
          </Link>

          <div className="w-px h-[500px] bg-white/10" /> {/* ayırıcı çizgi yüksekliği artırıldı */}

          <Link href="/receive" className="flex-1 max-w-2xl px-8 min-h-0 aspect-square">
            <div className="bg-white/5 backdrop-blur-sm p-16 rounded-3xl text-white text-center border border-white/10 hover:scale-105 transition-transform h-full">
              <div className="w-40 h-40 mx-auto mb-8 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-28 h-28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 5l9 14H3l9-14zm0 0v8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl font-bold mb-6">Receive File</h2>
              <p className="text-gray-400 text-lg">
                Click to receive files sent to you
              </p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}

export default Home;