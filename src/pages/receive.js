import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { createRTCConnectionManager } from '../lib/rtc-socket-connector-client';
import { createFileHash } from '../lib/hash';
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal } from "starknetkit";
import styles from './styles.module.css';

export default function Receive() {
  const [socketId, setSocketId] = useState('');
  const [isReceiving, setIsReceiving] = useState(false);
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [secretText, setSecretText] = useState('');
  const [hash, setHash] = useState('');
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const socketRef = useRef(null);
  const dataChannelRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const rtcConnectionManagerRef = useRef(null); 
  const downloadBufferRef = useRef({});

useEffect(() => {
  
  const socket = io("https://starknet-file-transfer.vercel.app/api/socketio", {
    path: '/api/socketio' 
  });

  socket.on('connect', () => {
    console.log('Connected with ID:', socket.id);
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

  return () => socketRef.current?.disconnect();
}, []);


  useEffect(() => {
    if (secretText && socketId) {
      const newHash = createFileHash(socketId, secretText);
      console.log('Generated Hash:', newHash, 'from:', {socketId, secretText}); // Debug için
      setHash(newHash);
    }
  }, [secretText, socketId]);

  const connectWallet = async () => {
    const { starknetkitConnectModal } = useStarknetkitConnectModal({
      connectors: connectors
    })

    const { connector } = await starknetkitConnectModal()
    await connect({ connector })
  }

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
      {/* ... uzay efekti */}
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
            {/* ID Bilgisi */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Sizin ID</label>
              <div className="bg-white/10 p-3 rounded font-mono">
                {socketId || 'Bağlanıyor...'}
              </div>
            </div>

            {/* Güvenlik Kodu Oluşturma */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Güvenlik Metni
              </label>
              <input
                type="text"
                value={secretText}
                onChange={(e) => setSecretText(e.target.value)}
                className="w-full bg-white/10 p-3 rounded text-white outline-none"
                placeholder="Bir metin girin"
              />
            </div>

            {hash && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Güvenlik Kodu
                </label>
                <div className="bg-white/10 p-3 rounded font-mono text-green-400">
                  {hash}
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Bu kodu dosya gönderecek kişiyle paylaşın
                </p>
              </div>
            )}

            {/* Alınan Dosyalar */}
            {receivedFiles.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Alınan Dosyalar:</h3>
                <ul className="space-y-2">
                  {receivedFiles.map((file, index) => (
                    <li key={index} className="flex justify-between items-center p-3 bg-white/10 rounded">
                      <span>{file.name}</span>
                      <button
                        onClick={() => downloadFile(file)}
                        className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 transition"
                      >
                        İndir
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Aktif Transfer */}
            {isReceiving && (
              <div className="text-center text-gray-300">
                <p>Dosya alınıyor: {currentFile}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
