"use client";
import styles from './styles.module.css';
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import { useStarknetkitConnectModal } from "starknetkit";
import Link from 'next/link';

function Home() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();

  const connectWallet = async () => {
    const { starknetkitConnectModal } = useStarknetkitConnectModal({
      connectors: connectors
    })

    const { connector } = await starknetkitConnectModal()
    await connect({ connector })
  }

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
              <h2 className="text-4xl font-bold mb-6">Dosya Gönder</h2>
              <p className="text-gray-400 text-lg">
                Güvenli ve hızlı dosya paylaşımı için tıklayın
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
              <h2 className="text-4xl font-bold mb-6">Dosya Al</h2>
              <p className="text-gray-400 text-lg">
                Size gönderilen dosyaları almak için tıklayın
              </p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}

export default Home;