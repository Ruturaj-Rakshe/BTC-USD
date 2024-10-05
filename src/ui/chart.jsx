"use client";
import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { fetchBTCData, fetchLiveBTCData } from './api';
import Header from './header';

const formatPriceData = (priceData) => {
    return priceData.map(([timestamp, price], index, array) => {
        // Ensure we have previous and next data points to form OHLC
        const prev = array[index - 1] ? array[index - 1][1] : price;
        const next = array[index + 1] ? array[index + 1][1] : price;
        return {
          time: Math.floor(timestamp / 1000) + 19800,  // Convert to seconds (localized)
          open: prev,
          high: Math.max(prev, price, next),
          low: Math.min(prev, price, next),
          close: price,
        };
      });
}

const formatVolumeData = (priceData, volumeData) => {
    return volumeData.map(([timestamp, volume], index) => {
        const previousClose = index > 0 ? priceData[index - 1][1] : priceData[index][1]; // Adjust based on your candlestick data
        const currentClose = priceData[index][1];  // Current close price from candlestick data
      
        // Determine color based on price movement
        const color = currentClose >= previousClose ? '#26a69a' : '#ef5350';
      
        return {
          time: Math.floor(timestamp / 1000) + 19800,  // Convert to seconds
          value: volume,
          color: color,  // Add color property
        };
    });
}

export default function Home() {
  const chartContainerRef = useRef(null);  // Ref for chart container
  const [chart, setChart] = useState(null);  // State to hold the chart instance
  const [priceData, setPriceData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [timeScale, setTimeScale] = useState("1D");
  const didFetchData = useRef(false);

  // Bollinger Bands calculation function
  function calculateBollingerBands(data, period = 20, multiplier = 2) {
    const bands = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const closePrices = slice.map(item => item.close);
      const sma = closePrices.reduce((sum, price) => sum + price, 0) / period;
      const stdDev = Math.sqrt(
        closePrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
      );
      const upperBand = sma + stdDev * multiplier;
      const lowerBand = sma - stdDev * multiplier;

      bands.push({
        time: data[i].time,
        sma,
        upperBand,
        lowerBand,
      });
    }
    return bands;
  }

  // Function to calculate Fibonacci levels
  function calculateFibonacciLevels(data) {
    const high = Math.max(...data.map(d => d.high));  // Highest price
    const low = Math.min(...data.map(d => d.low));    // Lowest price
    const diff = high - low;

    return [
      { time: data[data.length - 1].time, level: high, label: '100%' },
      { time: data[data.length - 1].time, level: high - diff * 0.618, label: '61.8%' },
      { time: data[data.length - 1].time, level: high - diff * 0.5, label: '50%' },
      { time: data[data.length - 1].time, level: high - diff * 0.382, label: '38.2%' },
      { time: data[data.length - 1].time, level: low, label: '0%' },
    ];
  }

  useEffect(() => {
    console.log("called")

    async function fetchData() {
      const { historicalPriceData, historicalVolumeData } = await fetchBTCData(timeScale);
      const formattedPriceData = formatPriceData(historicalPriceData)
      const formattedVolumeData = formatVolumeData(historicalPriceData, historicalVolumeData)
      const bollingerBands = calculateBollingerBands(formattedPriceData);

      setPriceData(historicalPriceData)
      setVolumeData(historicalVolumeData)

      if (chartContainerRef.current && !chart) {
        // Create chart and set it up
        console.log(chartContainerRef.current.clientHeight)
        const newChart = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.clientWidth,
          height: 600,//chartContainerRef.current.clientHeight,
          layout: {
            backgroundColor: '#ffffff', // White background
            textColor: '#000000', // Black text
          },
          grid: {
            vertLines: {
              color: '#e1e1e1',
            },
            horzLines: {
              color: '#e1e1e1',
            },
          },
          crosshair: {
            mode: 1, // Enables crosshair movement
          },
          rightPriceScale: {
            borderColor: '#ccc',
          },
          timeScale: {
            borderColor: '#ccc',
            timeVisible: true, // Show time (hours) on X-axis
            secondsVisible: false, 
          },
        });

        // Add candlestick series for price data        
        const candleSeries = newChart.addCandlestickSeries({
          upColor: '#4caf50', // Green for up candles
          downColor: '#ef5350', // Red for down candles
          borderUpColor: '#4caf50',
          borderDownColor: '#ef5350',
          wickUpColor: '#4caf50',
          wickDownColor: '#ef5350',
        });
        candleSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.1,
            bottom: 0.2
          }
        });
        candleSeries.setData(formattedPriceData);  // Set candlestick data to the chart

        // Add volume series for volume data
        const volumeSeries = newChart.addHistogramSeries({
          priceFormat: {
            type: 'volume',  // Indicate this series represents volume data
          },
          priceScaleId: '',
        });
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.9,
            bottom: 0
          }
        });
        volumeSeries.setData(formattedVolumeData);

        // Add line series for Bollinger Bands (Upper, Lower, and SMA)
        const upperBandSeries = newChart.addLineSeries({
          color: 'rgba(255, 0, 0, 0.5)', // Red for upper band
          lineWidth: 1,
        });
        const lowerBandSeries = newChart.addLineSeries({
          color: 'rgba(0, 0, 255, 0.5)', // Blue for lower band
          lineWidth: 1,
        });
        const smaSeries = newChart.addLineSeries({
          color: 'rgba(0, 128, 0, 0.5)', // Green for SMA
          lineWidth: 1,
        });

        // Set Bollinger Band data
        upperBandSeries.setData(bollingerBands.map(band => ({ time: band.time, value: band.upperBand })));
        lowerBandSeries.setData(bollingerBands.map(band => ({ time: band.time, value: band.lowerBand })));
        smaSeries.setData(bollingerBands.map(band => ({ time: band.time, value: band.sma })));

        // Calculate and draw Fibonacci levels
        // const fibonacciLevels = calculateFibonacciLevels(formattedPriceData);
        // fibonacciLevels.forEach(level => {
        //   newChart.addLineSeries({
        //     color: '#FF6347', // Color for Fibonacci levels
        //     lineWidth: 2,
        //   }).setData([{ time: level.time, value: level.level }]);
        // });

        // Set the chart instance in state
        setChart(newChart);

        return setInterval(async () => {
            const liveData = await fetchLiveBTCData();
            console.log("fetch live data")
            
            if (newChart && liveData) {
              const time = Date.now() + 19800000;  // localized
  
              const updatedPriceData = [...priceData, [time, liveData.price]];
              const updatedVolumeData = [...volumeData, [time, liveData.volume]];
          
              // Format the new data for chart update
              const newPriceData = formatPriceData(updatedPriceData);
              const newVolumeData = formatVolumeData(updatedPriceData, updatedVolumeData);

              volumeSeries.update(newVolumeData[newVolumeData.length - 1]);  // Update the latest volume data
              candleSeries.update(newPriceData[newPriceData.length - 1]);  // Update the latest candlestick data
          
              // Update the state to store the new data
              setPriceData(updatedPriceData);
              setVolumeData(updatedVolumeData);
            }
          }, 5*60000);
      }
    }

    const i = fetchData().then((i) => i);
    return () => clearInterval(i)
  }, []);

  // Resize chart to be responsive
  useEffect(() => {
    if (!chart) return;

    const handleResize = () => {
      const width = chartContainerRef.current.clientWidth;
      const height = 0 //chartContainerRef.current.clientHeight // Maintain 16:9 aspect ratio
    //   console.log(chartContainerRef.current.clientHeight)

      chart.applyOptions({
        width: width,
        height: height,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();  // Call it once to set initial size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  return (
    <div className='bg-white'>
      {/* Use the Header component */}
      <Header timeScale={timeScale} setTimeScale={setTimeScale} />
      
      {/* Chart Container */}
      <div className="chart-container bg-white">
        <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
