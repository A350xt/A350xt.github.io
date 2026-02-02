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
  
  // Calculate daily change for sparklines color
  const getTrend = (contestant) => {
    if (history.length < 2) return 0;
    const curr = history[history.length - 1][contestant] || 0;
    const prev = history[history.length - 2][contestant] || curr;
    return curr - prev;
  };

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

      {/* Row: System Diagnostic (Big Board - Centered & Enlarged) */}
      <div className="row margin-bottom--lg">
         <div className="col col--12">
           <div className="card shadow--md" style={{background: '#f8f9fa', border: '1px solid #ddd'}}>
             <div className="card__header" style={{display:'flex', justifyContent:'space-between', borderBottom: '1px solid #eee'}}>
               <h3>System Diagnostic (Central EMA Board)</h3>
               <span className="badge badge--warning">REAL-TIME MONITOR</span>
             </div>
             <div className="card__body">
               <div style={{display: 'flex', gap: '4rem', marginBottom: '1rem', justifyContent: 'center'}}>
                  <div style={{textAlign: 'center'}}>
                    <small style={{textTransform: 'uppercase', color: '#666', fontWeight: 'bold'}}>Weight (w_t)</small>
                    <h1 style={{color: '#d35400', fontSize: '2.5rem', margin: 0}}>{currentDay.w_t.toFixed(4)}</h1>
                  </div>
                  <div style={{textAlign: 'center'}}>
                    <small style={{textTransform: 'uppercase', color: '#666', fontWeight: 'bold'}}>EMA Error</small>
                    <h1 style={{color: currentDay.ema_error > 0.15 ? '#c0392b' : '#27ae60', fontSize: '2.5rem', margin: 0}}>
                      {currentDay.ema_error.toFixed(4)}
                    </h1>
                  </div>
               </div>
               <div style={{height: '300px', width: '100%'}}>
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={history}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" hide={true} />
                     <YAxis orientation="right" domain={[0, 'auto']} tick={{fontSize: 12}} />
                     <Tooltip />
                     <Area type="monotone" dataKey="ema_error" stroke="#8884d8" fill="#8884d8" fillOpacity={0.1} name="EMA Error" isAnimationActive={false}/>
                     <Line type="step" dataKey="w_t" stroke="#d35400" strokeWidth={3} name="System Weight (w_t)" dot={false} isAnimationActive={false}/>
                     {currentDay.is_show_day && (
                        <ReferenceLine x={`W${currentDay.week}D${currentDay.day_of_week}`} stroke="red" strokeDasharray="3 3" />
                     )}
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
             </div>
           </div>
         </div>
      </div>

      <div className="row">
        {/* Left Column: Contestant Grid (Small Windows) */}
        <div className="col col--9">
          <div className="row">
            {activeContestants.sort((a,b) => currentDay.prices[b] - currentDay.prices[a]).map((c) => {
               const trend = getTrend(c);
               const trendColor = trend > 0 ? '#2ecc71' : (trend < 0 ? '#e74c3c' : '#bdc3c7');
               const userShares = portfolio[c] || 0;
               
               return (
                <div key={c} className="col col--4 margin-bottom--md">
                   <div className="card shadow--lw" style={{height: '100%'}}>
                      <div className="card__header" style={{padding: '0.8rem 1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                         <div style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'}}>
                            <h4 style={{margin:0}} title={c}>{c}</h4>
                            <small>{userShares > 0 ? `${userShares} shares` : 'No position'}</small>
                         </div>
                         <div style={{textAlign: 'right'}}>
                            <h3 style={{margin:0, color: 'var(--ifm-color-primary)'}}>{currentDay.prices[c].toFixed(2)}</h3>
                         </div>
                      </div>
                      
                      <div className="card__body" style={{padding: '0 1rem'}}>
                         {/* Mini Sparkline */}
                         <div style={{height: '100px', width: '100%'}}>
                           <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={history}>
                               <Line 
                                 type="monotone" 
                                 dataKey={c} 
                                 stroke={trendColor} 
                                 strokeWidth={2} 
                                 dot={false} 
                                 isAnimationActive={false} 
                               />
                             </LineChart>
                           </ResponsiveContainer>
                         </div>
                      </div>
                      
                      <div className="card__footer" style={{padding: '0.8rem'}}>
                         <div className="button-group button-group--block">
                             <button 
                                 className="button button--success button--sm button--outline"
                                 disabled={!isMarketOpen}
                                 onClick={() => handleTrade(c, 'buy')}
                                 title="Buy 100 shares">
                                 Buy
                             </button>
                             <button 
                                 className="button button--danger button--sm button--outline"
                                 disabled={!isMarketOpen || userShares <= 0}
                                 onClick={() => handleTrade(c, 'sell')}
                                 title="Sell 100 shares">
                                 Sell
                             </button>
                         </div>
                      </div>
                   </div>
                </div>
               );
            })}
          </div>
        </div>

        {/* Right Column: Wallet & Info */}
        <div className="col col--3">
           <div className="card shadow--md sticky-top" style={{position: 'sticky', top: '80px'}}>
             <div className="card__header">
                <h3><Users size={16}/> Profile</h3>
             </div>
             <div className="card__body text--center">
                <small>My Coin Balance</small>
                <h1 style={{color: 'var(--ifm-color-primary)', fontSize: '2rem', margin: '0.5rem 0'}}>
                   ₵ {userFunds.toFixed(0)}
                </h1>
                <hr/>
                <div style={{textAlign:'left'}}>
                   <small><strong>Next Elimination:</strong></small>
                   <p>Saturday (Day 7)</p>
                   {currentDay.eliminated_today && currentDay.eliminated_today.length > 0 && (
                     <div className="alert alert--danger" style={{padding:'0.5rem'}}>
                        <strong>OUT:</strong> {currentDay.eliminated_today.join(', ')}
                     </div>
                   )}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}


