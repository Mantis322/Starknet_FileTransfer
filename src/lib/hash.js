export const createFileHash = (receiverId, secretText) => {
    // A simple hash function
    const text = `${receiverId}-${secretText}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Convert hash to 6 character alphanumeric code
    const code = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    return code;
  };
  
  export const verifyHash = (receiverId, secretText, hash) => {
    const generatedHash = createFileHash(receiverId, secretText);
    return generatedHash === hash.toUpperCase();
  };