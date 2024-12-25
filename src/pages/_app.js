import "@/styles/globals.css";
import StarknetProvider from "../components/starknet-provider";
import { mainnet, sepolia } from "@starknet-react/chains";

export default function App({ Component, pageProps }) {
  return (
    <StarknetProvider chain="sepolia">
      <Component {...pageProps} />
    </StarknetProvider>
  );
}
