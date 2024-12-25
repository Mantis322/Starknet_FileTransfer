export const createFileHash = (receiverId, secretText) => {
    // Basit bir hash fonksiyonu
    const text = `${receiverId}-${secretText}`;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a dönüştür
    }
    // Hash'i 6 karakterli alfanumerik koda dönüştür
    const code = Math.abs(hash).toString(36).substring(0, 6).toUpperCase();
    return code;
  };
  
  export const verifyHash = (receiverId, secretText, hash) => {
    const generatedHash = createFileHash(receiverId, secretText);
    return generatedHash === hash.toUpperCase();
  };