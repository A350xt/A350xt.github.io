import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Shield } from 'lucide-react';

const INITIAL_CONTESTANTS = [
  { id: 1, name: 'Jerry Rice', role: 'Legend', price: 0.85, trend: 0.0, history: [0.85] },
  { id: 2, name: 'Billy Ray', role: 'Viral Star', price: 0.92, trend: 0.0, history: [0.92] },
  { id: 3, name: 'Stacy Keibler', role: 'Talent', price: 0.60, trend: 0.0, history: [0.60] },
  { id: 4, name: 'Master P', role: 'Disruptor', price: 0.40, trend: 0.0, history: [0.40] },
];

export default function MarketSimulation() {
  const [contestants, setContestants] = useState(INITIAL_CONTESTANTS);
  const [week, setWeek] = useState(1);
  const [userFunds, setUserFunds] = useState(1000);
  const [portfolio, setPortfolio] = useState({});

  // Simulate market movement
  const updatePrices = (id, direction) => {
    setContestants(prev => prev.map(c => {
      if (c.id !== id) return c;
      
      const change = direction === 'buy' ? 0.02 : -0.02;
      let newPrice = Math.max(0.01, Math.min(0.99, c.price + change));
      
      // Add random noise
      newPrice += (Math.random() - 0.5) * 0.005;
      
      return {
        ...c,
        price: newPrice,
        history: [...c.history, newPrice]
      };
    }));
  };

  const handleTrade = (id, direction) => {
    const contestant = contestants.find(c => c.id === id);
    if (!contestant) return;

    if (direction === 'buy') {
      if (userFunds < 10) return; // Scale cost
      setUserFunds(f => f - 10);
      setPortfolio(p => ({ ...p, [id]: (p[id] || 0) + 10 }));
      updatePrices(id, 'buy');
    } else {
      if (!portfolio[id] || portfolio[id] <= 0) return;
      setUserFunds(f => f + 10);
      setPortfolio(p => ({ ...p, [id]: p[id] - 10 }));
      updatePrices(id, 'sell');
    }
  };

  const nextWeek = () => {
    setWeek(w => w + 1);
    // Simulate random market fluctuations for everyone
    setContestants(prev => prev.map(c => {
      const randomMove = (Math.random() - 0.5) * 0.05;
      const newPrice = Math.max(0.01, Math.min(0.99, c.price + randomMove));
      return {
        ...c,
        price: newPrice,
        history: [...c.history, newPrice]
      };
    }));
  };

  return (
    <div className="container margin-vert--lg">
      <div className="row">
        <div className="col col--12 text--center margin-bottom--md">
          <h1>APSM-B3R Live Market Demo</h1>
          <p>Trade shares in contestants. Higher Price = Higher Survival Probability.</p>
        </div>
      </div>

      <div className="row">
        {/* Market Status Board */}
        <div className="col col--4">
          <div className="card padding--md" style={{background: 'var(--ifm-color-white)'}}>
            <h3><Users size={20} /> My Portfolio</h3>
            <div className="margin-bottom--md">
              <h2>${userFunds.toFixed(2)}</h2>
              <small>Available Funds</small>
            </div>
            <hr />
            {Object.keys(portfolio).length === 0 && <p>No active investments.</p>}
            {Object.entries(portfolio).map(([id, amount]) => {
                const c = contestants.find(x => x.id === parseInt(id));
                return c && amount > 0 ? (
                    <div key={id} style={{display:'flex', justifyContent:'space-between'}}>
                        <span>{c.name}</span>
                        <strong>{amount} shares</strong>
                    </div>
                ) : null;
            })}
            
            <button className="button button--secondary button--block margin-top--lg" onClick={nextWeek}>
              Advance to Week {week + 1}
            </button>
          </div>
        </div>

        {/* Contestant Cards */}
        <div className="col col--8">
          <div className="row">
            {contestants.map((c) => (
              <div key={c.id} className="col col--6 margin-bottom--md">
                <div className="card">
                  <div className="card__header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h3>{c.name}</h3>
                    <span className="badge badge--primary">{c.role}</span>
                  </div>
                  <div className="card__body">
                    <div style={{display:'flex', alignItems:'baseline', gap:'10px'}}>
                      <h1 style={{color: 'var(--ifm-color-primary)', margin:0}}>
                        ${c.price.toFixed(2)}
                      </h1>
                      <small style={{color: c.price > c.history[c.history.length-2] ? 'green' : 'red'}}>
                        {((c.price - (c.history[c.history.length-2] || c.price))*100).toFixed(1)}%
                      </small>
                    </div>
                    
                    <div style={{height: '200px', width: '100%', marginTop: '10px', minHeight: '200px'}}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={c.history.map((h, i) => ({week: i, price: h}))}>
                          <Line type="monotone" dataKey="price" stroke="var(--ifm-color-primary)" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="card__footer">
                    <div className="button-group button-group--block">
                      <button 
                        className="button button--success"
                        onClick={() => handleTrade(c.id, 'buy')}>
                        <TrendingUp size={16} /> Buy
                      </button>
                      <button 
                        className="button button--danger"
                        onClick={() => handleTrade(c.id, 'sell')}>
                        <TrendingDown size={16} /> Sell
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
