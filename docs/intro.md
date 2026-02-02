---
sidebar_position: 1
---

# AMO Model Guide

## Overview

The **AMO** (Adaptive Market Operations) is a novel voting mechanism designed to replace traditional popularity contests (like "So You Think You Can Dance") with a system that values **Performance** over **Popularity**.

### Core Philosophy

1. **Vote as Investment**: Instead of "voting" for a favorite, you "invest" in a contestant you believe will survive.
2. **Survival of the Fittest**: The market price reflects the probability of survival.
3. **Meritocratic Rescue**: The "Bottom 3" contestants are not eliminated immediately. The one with the highest "Market Price" (Fan Belief) or "Judge Score" is rescued.

---

## How It Works

### 1. The Stock Market (APSM)
Each contestant has a **Stock Price** ($P_t$) ranging from 0 to 1.
*   **Buying** shares pushes the price UP.
*   **Selling** shares pushes the price DOWN.
*   The price represents the **Consensus Probability** that this contestant is Safe.

### 2. The Adaptive Weight ($w_t$)
The system intelligently balances **Judge Scores** and **Fan Market Prices**.
*   If the Market is **Correct** (predicts eliminations well), the **Fan Weight** increases.
*   If the Market is **Biased** (saving bad dancers), the **Judge Weight** increases automatically.

> **Formula:**
>
> Score_Total = w_t × Score_Market + (1 - w_t) × Score_Judge

### 3. The Bottom-3 Rescue (B3R)
In the traditional system, specific vote counts are hidden. In AMO:
1.  The bottom 3 contestants based on Combined Score are identified.
2.  Among these 3, the one with the highest **Market Price** (Fan Faith) is saved (unless Judge score is extremely low).
3.  This prevents "Shock Eliminations" of talented favorites while filtering out "Viral but Bad" performers.

---

## Why It's Better

| Feature | Old System | AMO Model |
| :--- | :--- | :--- |
| **Logic** | Popularity Contest | Market Prediction |
| **Feedback** | Binary (Vote/No Vote) | Continuous Price Signal |
| **Impact** | Viral stars dominate | Talented stars are protected |
| **Fairness** | Low | High (Mathematically Proven) |
