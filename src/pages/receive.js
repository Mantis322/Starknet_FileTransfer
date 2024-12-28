import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { createRTCConnectionManager } from '../lib/rtc-socket-connector-client';
import { createFileHash } from '../lib/hash';
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal } from "starknetkit";
import styles from './styles.module.css';
import { WalletAccount, Contract } from 'starknet';
import PermissionManager from './PermissionManager';
import Link from 'next/link';
const permissionManagerABI = require('./PermissionManagerABI.json');


export default function Receive() {
  const [socketId, setSocketId] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [hash, setHash] = useState('');
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const [walletAccount, setWalletAccount] = useState(null);

  const socketRef = useRef(null);
  const dataChannelRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const rtcConnectionManagerRef = useRef(null);
  const downloadBufferRef = useRef({});
  const walletRef = useRef(null);

  const contractAddress = '0x06462c81a901843c8f6ac3245e390abb3edf2f5b49be0446b13cd6ebb0a25fdb'
  

  useEffect(() => {
    fetch('/api/socket').finally(() => {
      const socket = io({
        path: '/api/socketio'
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
        setSocketId(socket.id);
      });

      socketRef.current = socket;

      const rtcConnectionHandler = {
        onDataChannel: handleDataChannel,
        onRTCPeerConnection: handleRTCPeerConnection
      };

      rtcConnectionManagerRef.current = createRTCConnectionManager(
        socket,
        rtcConnectionHandler
      );
    });

    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (socketId && (secretText || (isConnected && address))) {
      const textToHash = isConnected ? address : secretText;
      const newHash = createFileHash(socketId, textToHash);
      console.log('Generated Hash:', newHash, 'from:', { socketId, text: textToHash });
      setHash(newHash);
    }
  }, [secretText, socketId, isConnected, address]);

  useEffect(() => {
    if (isConnected && !walletRef.current && connectors[0]) {
      const account = new WalletAccount(
        { nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7' },
        connectors[0]
      );
      walletRef.current = account;
      setWalletAccount(account);
    }
  }, [isConnected, connectors]);

  const connectWallet = async () => {
    try {
      const { starknetkitConnectModal } = useStarknetkitConnectModal({
        connectors: connectors
      });

      const { connector } = await starknetkitConnectModal();
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      walletRef.current = null;
      setWalletAccount(null);
      setSecretText('');
      setHash('');
    } catch (error) {
      console.error("Cüzdan bağlantısını kesme hatası:", error);
    }
  };

  const handleDataChannel = (socketId, newDataChannel) => {
    console.log('Data channel connected with:', socketId);

    if (newDataChannel.label === "main") {
      dataChannelRef.current = newDataChannel;

      newDataChannel.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "StartFileTransfer":
            setIsReceiving(true);
            setCurrentFile(message.fileName);
            break;
          default:
            console.error("Invalid Message Type");
        }
      });
    } else {
      // Dosya transfer kanalı
      const fileName = newDataChannel.label;
      downloadBufferRef.current[fileName] = [];

      newDataChannel.addEventListener("message", (event) => {
        downloadBufferRef.current[fileName].push(event.data);
      });

      newDataChannel.addEventListener("close", () => {
        handleFileReceived(fileName);
      });
    }
  };

  const handleRTCPeerConnection = (socketId, newRTCPeerConnection) => {
    rtcPeerConnectionRef.current = newRTCPeerConnection;
  };

  const handleFileReceived = (fileName) => {
    setIsReceiving(false);
    setCurrentFile(null);
    setReceivedFiles(prev => [...prev, {
      name: fileName,
      data: downloadBufferRef.current[fileName]
    }]);
  };

  const downloadFile = (file) => {
    const blob = new Blob(file.data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen relative bg-black">
      <div className="absolute inset-0">
        <div className="stars" />
        <div className="stars2" />
        <div className="stars3" />
      </div>

      <div className={styles.description}>
        <div className={styles.logoContainer}>
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <img
            src="https://starknetkit-website-f0ejy1m72-argentlabs.vercel.app/starknetKit-logo-white.svg"
            alt="starknetkit logo"
          />
          <span>P2P File Transfer With Starknet</span>
          </Link>
        </div>
        <div className={styles.walletActions}>
          {isConnected ? (
            <>
              <button className={styles.connectbtn}>
                {address.slice(0, 5)}...{address.slice(60, 66)}
              </button>
              <button onClick={handleDisconnect} className={`${styles.connectbtn} ${styles.disconnectBtn}`}>
                Disconnect
              </button>
            </>
          ) : (
            <button onClick={connectWallet} className={styles.connectbtn}>
              Connect
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-md mx-auto pt-20 px-4">
        <div className="bg-black/40 backdrop-blur-sm p-8 rounded-2xl text-white">
          <div className="space-y-6">
            {/* Permission Management Button */}
            {isConnected && (
              <div className="flex justify-end">
                <button
                  onClick={() => setPermissionModalVisible(true)}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  Manage Permission
                </button>
              </div>
            )}

            {/* ID Information */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your ID</label>
              <div className="bg-white/10 p-3 rounded font-mono">
                {socketId || 'Connecting...'}
              </div>
            </div>

            {/* Security Code Generation */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Wallet Adress
              </label>
              <input
                type="text"
                value={isConnected ? address : secretText}
                onChange={(e) => !isConnected && setSecretText(e.target.value)}
                className="w-full bg-white/10 p-3 rounded text-white outline-none"
                placeholder="Connect a wallet"
                disabled={isConnected}
              />
            </div>

            {hash && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Security Code
                </label>
                <div className="bg-white/10 p-3 rounded font-mono text-green-400">
                  {hash}
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Share this code with the file sender
                </p>
              </div>
            )}

            {/* Received Files */}
            {receivedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Received Files:</h3>
                <ul className="space-y-2">
                  {receivedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center p-3 bg-white/10 rounded">
                      <span>{file.name}</span>
                      <button
                        onClick={() => downloadFile(file)}
                        className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Active Transfer */}
            {isReceiving && (
              <div className="text-center text-gray-300">
                <p>Dosya alınıyor: {currentFile}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PermissionManager
        isOpen={permissionModalVisible}
        onClose={() => setPermissionModalVisible(false)}
        contractAddress={contractAddress}
        address={address}
        wallet={walletAccount}
      />
    </div>
  );
}