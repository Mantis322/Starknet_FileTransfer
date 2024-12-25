import React, { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";
import { createRTCConnectionManager } from "../lib/rtc-socket-connector-client";

const CHUNK_SIZE = 16384;

export default function P2PFileShare() {
  const [socketId, setSocketId] = useState('');
  const [connectedSocketId, setConnectedSocketId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [fileList, setFileList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const socketRef = useRef(null);
  const dataChannelRef = useRef(null);
  const rtcPeerConnectionRef = useRef(null);
  const rtcConnectionManagerRef = useRef(null);
  const filesRef = useRef({});
  const downloadBufferRef = useRef({});

  useEffect(() => {
    fetch('/api/socket').finally(() => {
      const socket = io({
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
    });

    return () => socketRef.current?.disconnect();
  }, []);

  const handleDataChannel = (socketId, newDataChannel) => {
    setConnectedSocketId(socketId);

    if (newDataChannel.label === "main") {
      dataChannelRef.current = newDataChannel;

      dataChannelRef.current.addEventListener("message", (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "StartDownloadFile":
            handleUploadFile(message.fileName);
            break;
          case "UploadFile":
            setFileList(prev => [...prev, { name: message.fileName, downloadable: true }]);
            break;
          default:
            console.error("Invalid Message Type");
        }
      });
    } else {
      const fileName = newDataChannel.label;
      downloadBufferRef.current[fileName] = [];

      newDataChannel.addEventListener("message", (event) => {
        downloadBufferRef.current[fileName].push(event.data);
      });

      newDataChannel.addEventListener("close", () => {
        downloadFile(fileName);
        downloadBufferRef.current[fileName] = [];
      });
    }
  };

  const handleRTCPeerConnection = (socketId, newRTCPeerConnection) => {
    rtcPeerConnectionRef.current = newRTCPeerConnection;
  };

  const handleConnect = () => {
    if (rtcConnectionManagerRef.current && targetId) {
      rtcConnectionManagerRef.current.connect(targetId, {
        enableDataChannel: true
      });
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      filesRef.current[file.name] = file;
      setFileList(prev => [...prev, { name: file.name, downloadable: false }]);
      sendMessage({
        type: "UploadFile",
        fileName: file.name,
      });
    }
  };

  const sendMessage = (message) => {
    if (dataChannelRef.current) {
      dataChannelRef.current.send(JSON.stringify(message));
    } else {
      console.error("Data channel not available");
    }
  };

  const startDownload = (fileName) => {
    sendMessage({
      type: "StartDownloadFile",
      fileName,
    });
  };

  const handleUploadFile = (fileName) => {
    const file = filesRef.current[fileName];
    if (rtcPeerConnectionRef.current && file) {
      const fileDataChannel = rtcPeerConnectionRef.current.createDataChannel(fileName);
      fileDataChannel.binaryType = "arraybuffer";
      
      fileDataChannel.addEventListener("open", () => {
        const fileReader = new FileReader();
        let offset = 0;

        fileReader.addEventListener("load", (event) => {
          if (event?.target?.result instanceof ArrayBuffer) {
            fileDataChannel.send(event.target.result);
            offset += event.target.result.byteLength;

            if (offset < file.size) {
              readSliceBlob(offset);
            } else {
              fileDataChannel.close();
            }
          }
        });

        const readSliceBlob = (offset) => {
          const slice = file.slice(offset, offset + CHUNK_SIZE);
          fileReader.readAsArrayBuffer(slice);
        };

        readSliceBlob(0);
      });
    }
  };

  const downloadFile = (fileName) => {
    if (downloadBufferRef.current[fileName]) {
      const url = window.URL.createObjectURL(
        new Blob(downloadBufferRef.current[fileName])
      );
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <div className="space-y-4">
        <div>
          <div>Sizin ID: <span className="font-mono">{socketId}</span></div>
          {connectedSocketId && (
            <div>Bağlanılan ID: <span className="font-mono">{connectedSocketId}</span></div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder="Hedef ID"
            className="flex-1 border p-2 rounded"
          />
          <button
            onClick={handleConnect}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={!!connectedSocketId}
          >
            Bağlan
          </button>
        </div>

        {connectedSocketId && (
          <div className="space-y-4">
            <input
              type="file"
              onChange={handleFileSelect}
              className="w-full border p-2 rounded"
            />

            <div>
              <h3 className="font-bold mb-2">Dosyalar:</h3>
              <ul className="space-y-2">
                {fileList.map((file, index) => (
                  <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{file.name}</span>
                    {file.downloadable && (
                      <button
                        onClick={() => startDownload(file.name)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        İndir
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}