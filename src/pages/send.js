import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { createRTCConnectionManager } from '../lib/rtc-socket-connector-client';
import { verifyHash } from '../lib/hash';
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal } from "starknetkit";
import styles from './styles.module.css';
import { WalletAccount, Contract } from 'starknet';
const permissionManagerABI = require('./PermissionManagerABI.json');

const CHUNK_SIZE = 16384;

export default function Send() {
  // State definitions
  const [socketId, setSocketId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [securityCode, setSecurityCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [connectedId, setConnectedId] = useState('');
  const [recieverWallet, setRecieverWallet] = useState('');
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const [walletAccount, setWalletAccount] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null); 

  const contractAddress = '0x06462c81a901843c8f6ac3245e390abb3edf2f5b49be0446b13cd6ebb0a25fdb'

  // Ref definitions
  const socketRef = useRef(null);
  const dataChannelRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const rtcConnectionManagerRef = useRef(null);
  const walletRef = useRef(null);

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


  const handleQueryPermission = async () => {

    try {
      if (!walletAccount || !recieverWallet || !address) {
        console.error("Wallet or address information is missing");
        return;
      }

      const myTestContract = new Contract(permissionManagerABI.abi, contractAddress, walletAccount);
      
      const hasPermission = await myTestContract.has_permission(recieverWallet, address);

      setPermissionStatus(hasPermission)
      return hasPermission
    } catch (error) {
      console.error("Permission check error:", error);
      setPermissionStatus(false);
      return false;
    }

  };

  const handleDataChannel = (socketId, newDataChannel) => {
    setConnectedId(socketId);
    dataChannelRef.current = newDataChannel;
  };

  const handleRTCPeerConnection = (socketId, newRTCPeerConnection) => {
    rtcPeerConnectionRef.current = newRTCPeerConnection;
  };

  const verifySecurityCode = () => {
    console.log('Verifying:', { targetId, recieverWallet, securityCode });
    const isValid = verifyHash(targetId, recieverWallet, securityCode);
    setIsCodeVerified(isValid);
    setVerificationError(isValid ? '' : 'Invalid security code');
  };

  const handleSendFile = async () => {
    if (!selectedFile || !targetId || !isCodeVerified) return;

    setIsSending(true);

    try {
      if (rtcConnectionManagerRef.current) {
        await rtcConnectionManagerRef.current.connect(targetId, {
          enableDataChannel: true
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      if (rtcPeerConnectionRef.current) {
        const fileDataChannel = rtcPeerConnectionRef.current.createDataChannel(selectedFile.name);
        fileDataChannel.binaryType = "arraybuffer";

        fileDataChannel.addEventListener("open", () => {
          const fileReader = new FileReader();
          let offset = 0;

          fileReader.addEventListener("load", (event) => {
            if (event?.target?.result instanceof ArrayBuffer) {
              fileDataChannel.send(event.target.result);
              offset += event.target.result.byteLength;

              if (offset < selectedFile.size) {
                readSliceBlob(offset);
              } else {
                fileDataChannel.close();
                setIsSending(false);
              }
            }
          });

          const readSliceBlob = (offset) => {
            const slice = selectedFile.slice(offset, offset + CHUNK_SIZE);
            fileReader.readAsArrayBuffer(slice);
          };

          readSliceBlob(0);
        });
      }
    } catch (error) {
      console.error('Error sending file:', error);
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-black">
      {/* Uzay Efekti */}
      <div className="absolute inset-0">
        <div className="stars" />
        <div className="stars2" />
        <div className="stars3" />
      </div>

      <div className={styles.description}>
        <div className={styles.logoContainer}>
          <img
            src="https://starknetkit-website-f0ejy1m72-argentlabs.vercel.app/starknetKit-logo-white.svg"
            alt="starknetkit logo"
          />
          <span>P2P File Transfer With Starknet</span>
        </div>
        <div className={styles.walletActions}>
          {isConnected ? (
            <>
              <button className={styles.connectbtn}>
                {address.slice(0, 5)}...{address.slice(60, 66)}
              </button>
              <button onClick={disconnect} className={`${styles.connectbtn} ${styles.disconnectBtn}`}>
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
            {/* ID Info */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Your ID</label>
              <div className="bg-white/10 p-3 rounded font-mono">
                {socketId || 'Connecting...'}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Receiver ID
              </label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-white/10 p-3 rounded text-white outline-none"
                placeholder="Enter the recipient's ID"
              />
            </div>

            {/* Receiver Wallet ve Permission Check */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Receiver Wallet Address
              </label>
              <input
                type="text"
                value={recieverWallet}
                onChange={(e) => setRecieverWallet(e.target.value)}
                className="w-full bg-white/10 p-3 rounded text-white outline-none mb-4"
                placeholder="Enter the receiver wallet address"
              />
              <button
                onClick={handleQueryPermission}
                className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded text-white transition-colors mb-4"
                disabled={!recieverWallet || !isConnected}
              >
                Check Permission
              </button>

              {permissionStatus === false && (
                <div className="text-red-500 mb-4 text-center">
                  You are not authorized to send files
                </div>
              )}
            </div>

            {/* Security Code only visible if permission is available */}
            {permissionStatus === true && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Security Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value)}
                    className="flex-1 bg-white/10 p-3 rounded text-white outline-none"
                    placeholder="Enter the security code"
                  />
                  <button
                    onClick={verifySecurityCode}
                    className="bg-blue-500 px-4 rounded hover:bg-blue-600 transition"
                  >
                    Verify
                  </button>
                </div>
                {verificationError && (
                  <p className="mt-2 text-sm text-red-400">{verificationError}</p>
                )}
                {isCodeVerified && (
                  <p className="mt-2 text-sm text-green-400">Kod doğrulandı!</p>
                )}
              </div>
            )}

            {/* File operations are only visible when the code is verified */}
            {isCodeVerified && (
              <>
                <div>
                  <input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0])}
                    className="hidden"
                    id="file-input"
                  />
                  <label
                    htmlFor="file-input"
                    className="block w-full bg-white/10 p-4 rounded text-center cursor-pointer hover:bg-white/20 transition"
                  >
                    {selectedFile ? selectedFile.name : 'Select File'}
                  </label>
                </div>

                <button
                  onClick={handleSendFile}
                  className="w-full bg-blue-500 p-4 rounded font-bold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedFile || !targetId || isSending}
                >
                  {isSending ? 'Sending...' : 'Send File'}
                </button>

                {connectedId && (
                  <div className="text-green-400 text-sm text-center">
                    Connection established with {connectedId}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}