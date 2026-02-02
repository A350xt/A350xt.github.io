import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts';
import { Play, Pause, FastForward, TrendingUp, TrendingDown, Lock, Unlock, AlertTriangle } from 'lucide-react';
import marketData from '../data/marketData.json';

const COLORS = [
  '#FF6B35', '#2ec4b6', '#e71d36', '#ff9f1c', 
  '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51',
  '#d62828', '#003049', '#fcbf49', '#eae2b7'
];

export default function MarketSimulation() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500); // ms per day
  const [userFunds, setUserFunds] = useState(2000);
  const [portfolio, setPortfolio] = useState({});
  const [history, setHistory] = useState([]);
  
  const timerRef = useRef(null);

  // Initial Setup
  useEffect(() => {
    // Reset to start
    setHistory([formatDataPoint(marketData[0])]);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= marketData.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed]);

  // Update History on Index Change
  useEffect(() => {
    if (currentIndex > 0) {
      setHistory(prev => {
        // Avoid duplicates if re-rendering same index
        if (prev.length > currentIndex) return prev;
        return [...prev, formatDataPoint(marketData[currentIndex])];
      });
    }
  }, [currentIndex]);

  const currentDay = marketData[currentIndex];
  // Calculate Market Open/Close status
  // User Requirement: "Settings Saturday as show time, non-show time can be bought and sold freely"
  // Saturday is day_of_week 6? Or 7? In data prep, I used d=7 as Show Day.
  const isShowDay = currentDay.is_show_day; 
  const isMarketOpen = !isShowDay;

  function formatDataPoint(dayRecord) {
    return {
      name: `W${dayRecord.week}D${dayRecord.day_of_week}`,
      ...dayRecord,
      ...dayRecord.prices
    };
  }

  const handleTrade = (contestant, action) => {
    if (!isMarketOpen) return;
    
    const price = currentDay.prices[contestant];
    if (!price) return;
    
    // Cost basis: 100 units
    const cost = price * 100;
    
    if (action === 'buy') {
      if (userFunds >= cost) {
        setUserFunds(f => f - cost);
        setPortfolio(p => ({
          ...p,
          [contestant]: (p[contestant] || 0) + 100
        }));
      }
    } else {
      if ((portfolio[contestant] || 0) >= 100) {
        setUserFunds(f => f + cost);
        setPortfolio(p => ({
          ...p,
          [contestant]: p[contestant] - 100
        }));
      }
    }
  };

  // Get active contestants (who have a price > 0)
  const activeContestants = Object.keys(currentDay.prices).filter(c => currentDay.prices[c] > 0);

  return (
    <div className="container margin-vert--lg">
      {/* Header / Info Bar */}
      <div className="row margin-bottom--md">
        <div className="col col--12">
          <div className="card padding--md shadow--lw" style={{background: 'var(--ifm-color-white)', borderRadius: '8px', borderLeft: isMarketOpen ? '5px solid #2ecc71' : '5px solid #e74c3c'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h2 style={{margin: 0, color: 'var(--ifm-color-emphasis-900)'}}>
                  Week {currentDay.week} <span style={{fontWeight: 'normal', opacity: 0.7}}>Day {currentDay.day_of_week}</span>
                </h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px'}}>
                  {isMarketOpen ? <Unlock size={16} color="#2ecc71"/> : <Lock size={16} color="#e74c3c"/>}
                  <strong style={{color: isMarketOpen ? '#2ecc71' : '#e74c3c'}}>
                    {isMarketOpen ? 'MARKET OPEN' : 'SHOW AIRING - TRADING LOCKED'}
                  </strong>
                </div>
              </div>
              
              <div style={{textAlign: 'right'}}>
                <div className="button-group">
                  <button className="button button--secondary button--sm" onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />} 
                    {isPlaying ? ' Pause' : ' Play System'}
                  </button>
                  <button className="button button--secondary button--sm" onClick={() => setSpeed(s => s === 100 ? 500 : 100)}>
                    <FastForward size={16} /> {speed === 100 ? '1x' : '5x'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Left Column: Big Board & Stats */}
        <div className="col col--8">
          
          {/* Main Price Chart */}
          <div className="card margin-bottom--md">
             <div className="card__header">
               <h3>Market Prices (P_close)</h3>
             </div>
             <div className="card__body" style={{height: '400px', width: '100%'}}>
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={history}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                   <XAxis dataKey="name" hide={true} />
                   <YAxis domain={[0, 1]} />
                   <Tooltip 
                      contentStyle={{backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                   />
                   {activeContestants.map((c, i) => (
                     <Line 
                        key={c} 
                        type="monotone" 
                        dataKey={c} 
                        stroke={COLORS[i % COLORS.length]} 
                        step="monotone" // Smooth curve
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                     />
                   ))}
                   {currentDay.is_show_day && (
                      <ReferenceLine x={`W${currentDay.week}D${currentDay.day_of_week}`} stroke="red" label="Show" />
                   )}
                 </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          {/* System Health (Big Board EMA) */}
          <div className="row">
             <div className="col col--12">
               <div className="card margin-bottom--md" style={{background: '#f8f9fa'}}>
                 <div className="card__header" style={{display:'flex', justifyContent:'space-between'}}>
                   <h3>System Diagnostic (Big Board)</h3>
                   <span className="badge badge--warning">EMA Error Tracking</span>
                 </div>
                 <div className="card__body">
                   <div style={{display: 'flex', gap: '2rem', marginBottom: '1rem'}}>
                      <div>
                        <small>Current Adaptive Weight (w_t)</small>
                        <h2 style={{color: '#d35400'}}>{currentDay.w_t.toFixed(4)}</h2>
                      </div>
                      <div>
                        <small>System EMA Error</small>
                        <h2 style={{color: currentDay.ema_error > 0.15 ? '#c0392b' : '#27ae60'}}>
                          {currentDay.ema_error.toFixed(4)}
                        </h2>
                      </div>
                   </div>
                   <div style={{height: '150px', width: '100%'}}>
                     <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={history}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} />
                         <XAxis dataKey="name" hide={true} />
                         <YAxis domain={[0, 'auto']} />
                         <Tooltip />
                         <Area type="monotone" dataKey="ema_error" stroke="#8884d8" fill="#8884d8" name="EMA Error" isAnimationActive={false}/>
                         <Line type="step" dataKey="w_t" stroke="#d35400" strokeWidth={2} name="Weight (w_t)" dot={false} isAnimationActive={false}/>
                       </AreaChart>
                     </ResponsiveContainer>
                   </div>
                 </div>
               </div>
             </div>
          </div>

        </div>

        {/* Right Column: Trading Desk */}
        <div className="col col--4">
           {/* User Wallet */}
           <div className="card margin-bottom--md">
             <div className="card__body text--center">
                <small>My Coin Balance</small>
                <h1 style={{color: 'var(--ifm-color-primary)', fontSize: '2.5rem', margin: '0.5rem 0'}}>
                   ₵ {userFunds.toFixed(0)}
                </h1>
                <p style={{fontSize: '0.9rem', color: '#666'}}>
                   Portfolio Value: ₵ {Object.entries(portfolio).reduce((acc, [name, amt]) => {
                      const p = currentDay.prices[name] || 0;
                      return acc + (p * amt);
                   }, 0).toFixed(0)}
                </p>
             </div>
           </div>

           {/* Market List */}
           <div className="card" style={{height: '600px', overflowY: 'auto'}}>
              <div className="card__header">
                <h3>Active Markets</h3>
              </div>
              <div className="card__body">
                 {activeContestants.sort((a,b) => currentDay.prices[b] - currentDay.prices[a]).map((c, i) => (
                    <div key={c} style={{
                        padding: '10px', 
                        borderBottom: '1px solid #eee', 
                        background: (portfolio[c] > 0) ? '#fff8e1' : 'transparent'
                    }}>
                       <div style={{display:'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                          <strong>{c}</strong>
                          <span style={{color: 'var(--ifm-color-primary)', fontWeight: 'bold'}}>
                            {currentDay.prices[c].toFixed(3)}
                          </span>
                       </div>
                       
                       <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gap: '5px'}}>
                           <button 
                             className="button button--success button--sm button--outline"
                             disabled={!isMarketOpen}
                             onClick={() => handleTrade(c, 'buy')}>
                             Buy
                           </button>
                           <button 
                             className="button button--danger button--sm button--outline"
                             disabled={!isMarketOpen || (portfolio[c]||0) <= 0}
                             onClick={() => handleTrade(c, 'sell')}>
                             Sell {(portfolio[c] && portfolio[c]>0) ? `(${portfolio[c]})` : ''}
                           </button>
                       </div>
                    </div>
                 ))}
                 
                 {currentDay.eliminated_today && currentDay.eliminated_today.length > 0 && (
                     <div className="alert alert--danger margin-top--md">
                        <strong>Eliminated Today:</strong>
                        <ul style={{margin:0, paddingLeft:'1rem'}}>
                           {currentDay.eliminated_today.map(e => <li key={e}>{e}</li>)}
                        </ul>
                     </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

