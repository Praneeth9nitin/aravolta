# Data Center Monitoring System

A real-time data center telemetry dashboard built as a prototype inspired by [Aravolta](https://aravolta.com) — a YC-backed startup building software to monitor, control, and optimize data center assets.

The system simulates device-level telemetry (GPU servers, storage, networking, cooling) and streams it live to a React dashboard via WebSocket.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (React, TypeScript) |
| Backend | Node.js, WebSocket (`ws`) |
| Styling | Inline CSS, Google Fonts (DM Mono, Syne) |
| Language | TypeScript (ESM) |

---

## Project Structure

```
├── server/
│   ├── devices.ts       # Device definitions + telemetry math
│   └── server.ts        # WebSocket server, tick loop, snapshot broadcaster
├── src/
│   └── components/
│       └── Dashboard.tsx  # React dashboard, useTelemetry hook
└── README.md
```

---

## How It Works

### Device Simulation (`devices.ts`)

Eight devices across four categories are defined with base values for power, temperature, and utilization:

| Device | Type | Base Power |
|---|---|---|
| gpu-rack-01 to 04 | GPU Server | 2900–3400W |
| stor-01, stor-02 | Storage | 390–420W |
| net-01 | Networking | 280W |
| cool-01 | CRAC Unit | 1800W |

Each tick, three functions compute realistic time-varying values:

```
load(t)  = 0.85 + 0.15 × sin(t / 20 × π)     // sine wave workload cycle
power(t) = basePower × load(t) × af() + jitter(basePower × 0.03)
temp(t)  = baseTemp × (0.9 + 0.1 × load(t)) × af() + jitter(1.2)
util(t)  = clamp(0, 99, baseUtil × load(t) × af() + jitter(5))
```

- `af()` — anomaly factor, random multiplier between 1.0 and 1.5
- `jitter(range)` — uniform noise ± range, simulates sensor variance

### WebSocket Server (`server.ts`)

- Runs on `ws://localhost:8080`
- A global `setInterval` ticks every 1000ms
- Each tick computes a full snapshot of all 8 devices and broadcasts to all connected clients
- New clients receive an immediate snapshot on connection

### Dashboard (`Dashboard.tsx`)

- `useTelemetry()` hook manages the WebSocket connection and parses incoming JSON
- Metric cards show total power (kW), average temperature, average utilization, and PUE
- Sparklines track the last 30 data points for power and temperature
- Device table highlights anomalies red dot + red text when temp > 42°C or util > 90%

### PUE (Power Usage Effectiveness)

```
PUE = (IT Power + Cooling Power) / IT Power
```

Lower is better. Industry average is ~1.5. Hyperscalers target ~1.1.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the WebSocket server

```bash
npx tsx server/server.ts
```

### 3. Start the Next.js frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dashboard connects automatically and starts streaming telemetry.

---

## Replacing Simulated Data with Real Hardware

The simulation layer is isolated in `devices.ts`. To connect real hardware:

1. Replace the `power()`, `temp()`, `util()` functions with actual SNMP, IPMI, or Modbus polls
2. Keep the `getSnapshot()` structure in `server.ts` identical
3. The frontend requires no changes

```typescript
// swap this:
power: power(d.Base_power, tick)

// with something like:
power: await snmp.get(d.oid.power)
```

---

## Metrics Reference

| Metric | Description | Alert Threshold |
|---|---|---|
| Power (W) | Per-device wattage draw | — |
| Total Power (kW) | Sum across all devices | — |
| Temperature (°C) | Inlet temperature per device | > 42°C |
| Utilization (%) | Compute/resource utilization | > 90% |
| PUE | Power usage effectiveness ratio | > 1.5 |

---

## Why This Exists

This project was built as a working prototype to demonstrate understanding of Aravolta's core product domain data center telemetry, power monitoring, and anomaly detection.

The architecture mirrors how a real telemetry system works: a server-side collector polling devices and streaming structured data to a frontend via WebSocket. Swapping the simulation layer for real SNMP/IPMI calls would make this production-ready.