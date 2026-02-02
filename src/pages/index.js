import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import MarketSimulation from '../components/MarketSimulation';
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className="hero hero--primary" style={{backgroundImage: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)'}}>
      <div className="container">
        <h1 className="hero__title" style={{color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>
            AMO Model
        </h1>
        <p className="hero__subtitle" style={{color: '#fff'}}>
            Adaptive Market Operations
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Read the Documentation 
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Home`}
      description="AMO Model Demo">
      <HomepageHeader />
      <main style={{backgroundColor: '#fafafa', minHeight: '80vh'}}>
        <MarketSimulation />
      </main>
    </Layout>
  );
}
