import { useEffect, useRef, useState } from "react";
import { fetchLiveBTCPrice } from "./api"; // Assuming this API call fetches live BTC price

export default function Header({ timeScale, setTimeScale }) {
  const [btcPrice, setBtcPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const didFetchData = useRef(false);

  useEffect(() => {

    // Function to fetch and set BTC data
    async function fetchPriceData() {
      const liveData = await fetchLiveBTCPrice(); // Fetch real data

      if (liveData) {
        setBtcPrice(liveData.price);
        setPriceChange(liveData.priceChangePercentage);
      }
    }

    fetchPriceData(); // Fetch price data initially

    const interval = setInterval(fetchPriceData, 30000); // Refresh every 30 seconds
    // return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="header">
      <h1 className="title">Bitcoin Price Chart</h1>
      {/* <div className="time-scale">
        <button onClick={() => setTimeScale("1D")}>1D</button>
        <button onClick={() => setTimeScale("1M")}>1M</button>
        <button onClick={() => setTimeScale("1Y")}>1Y</button>
      </div> */}
      {btcPrice !== null && priceChange !== null ? (
        <div className="price">
          <span>
            <strong>BTC/USD: </strong>${btcPrice.toFixed(2)}
          </span>
          <span className={priceChange > 0 ? "price-up" : "price-down"}>
            ({priceChange > 0 ? "+" : ""}
            {priceChange.toFixed(2)}%)
          </span>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
