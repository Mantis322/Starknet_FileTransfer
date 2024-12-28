import React, { useState } from 'react';

const PermissionManager = ({ isOpen, onClose, contractAddress, address,wallet }) => {
  const [grantAddress, setGrantAddress] = useState('');
  const [revokeAddress, setRevokeAddress] = useState('');

  if (!isOpen) return null;

  const handleGrantPermission = async () => {
    
    const calls = [
        {
          contractAddress: contractAddress,
          entrypoint: "grant_permission",
          calldata: [address, grantAddress]
        }
      ];
  
      const result = await wallet.execute(calls);
    
      setGrantAddress('')
  
      console.log(result)

  };

  const handleRevokePermission = async () => {

    const calls = [
        {
          contractAddress: contractAddress,
          entrypoint: "delete_permissions",
          calldata: [address, revokeAddress]
        }
      ];
  
      const result = await wallet.execute(calls);
    
      setRevokeAddress('')
  
      console.log(result)

  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Arkaplan */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-black/90 border border-white/10 p-6 rounded-2xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Permission Management</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Granting Permission */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Granting Permission</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={grantAddress}
                onChange={(e) => setGrantAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
              />
              <button
                onClick={handleGrantPermission}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Grant Permission
              </button>
            </div>
          </div>

          {/* Delete Permission */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Delete Permission</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={revokeAddress}
                onChange={(e) => setRevokeAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
              />
              <button
                onClick={handleRevokePermission}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
              >
                Delete Permission
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;