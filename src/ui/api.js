import axios from 'axios';

const apiKey = "YOUR_API_KEY_HERE";

export const fetchLiveBTCData = async () => {
    try {
        const response = await axios.get(
            "https://api.coingecko.com/api/v3/simple/price",
            {
              params: {
                ids: "bitcoin", // Bitcoin's ID on CoinGecko
                vs_currencies: "usd", // Get price in USD
                include_market_cap: "true",
                include_24hr_vol: "true",
                include_24hr_change: "true",
              },
            }
          );
          return {
            price: response.data.bitcoin.usd,
            volume: response.data.bitcoin.usd_24h_vol,
          };
    } catch (error) {
      console.error("Error fetching data from CoinGecko:", error);
      return null;
    }
  }

// Fetching BTC data from CoinGecko
export const fetchBTCData = async (timeScale) => {
  let days = 1;
  if (timeScale === "1Y") days = 365;
  else if (timeScale === "1M") days = 30

  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart`;
  const params = {
    vs_currency: 'usd',
    days: days,
    // interval: 'minute',
  };

  try {
    const response = await axios.get(url, { params });
    const historicalPriceData = response.data.prices;
    const historicalVolumeData = response.data.total_volumes;

    return { historicalPriceData, historicalVolumeData }
  } catch (error) {
    console.error('Error fetching data from CoinGecko:', error);
    return { historicalPriceData: [], historicalVolumeData: [] };
  }
};


// Function to fetch live BTC data from CoinGecko API
export async function fetchLiveBTCPrice() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=true&include_last_updated_at=true&precision=2",
      {
        headers: {
            "X-CMC_PRO_API_KEY": apiKey,
            "Accept": "application/json",
        },
      }
    );

    const btcData = response.data.bitcoin;
    const price = btcData.usd;
    const priceChangePercentage = btcData.usd_24h_change;

    // Returning price and 24-hour percentage change
    return {
      price,
      priceChangePercentage,
    };
  } catch (error) {
    console.error("Error fetching Bitcoin price data:", error);
    return null; // Return null in case of an error
  }
}
