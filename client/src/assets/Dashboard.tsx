import { useEffect, useState, useRef } from "react"

interface DeviceState {
    Device: string
    Type: string
    Base_power: number
    Base_temp: number
    Base_util: number
    power: number
    temp: number
    util: number
}

interface Snapshot {
    tick: number
    timestamp: number
    devices: {
        gpus: DeviceState[]
        storage: DeviceState[]
        networking: DeviceState[]
        crac: DeviceState[]
    }
    totalPower: number
    avgTemp: number
    avgUtil: number
}

function useTelemetry() {
    const [data, setData] = useState<Snapshot | null>(null)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8080")
        ws.onopen = () => setConnected(true)
        ws.onclose = () => setConnected(false)
        ws.onmessage = (e) => setData(JSON.parse(e.data))
        return () => ws.close()
    }, [])

    return { data, connected }
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
    if (values.length < 2) return null
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const w = 80, h = 28
    const pts = values.map((v, i) => {
        const x = (i / (values.length - 1)) * w
        const y = h - ((v - min) / range) * h
        return `${x},${y}`
    }).join(" ")
    return (
        <svg width={w} height={h} style={{ display: "block" }}>
            <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.8" />
        </svg>
    )
}

function UtilBar({ value }: { value: number }) {
    const color = value > 90 ? "#ff4d4d" : value > 75 ? "#f5a623" : "#00e5a0"
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 72, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "'JetBrains Mono', monospace", minWidth: 32 }}>{value}%</span>
        </div>
    )
}

function StatusDot({ ok }: { ok: boolean }) {
    return (
        <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: ok ? "#00e5a0" : "#ff4d4d",
            boxShadow: ok ? "0 0 6px #00e5a0" : "0 0 6px #ff4d4d"
        }} />
    )
}

export default function Dashboard() {
    const { data, connected } = useTelemetry()
    const powerHistory = useRef<number[]>([])
    const tempHistory = useRef<number[]>([])

    useEffect(() => {
        if (!data) return
        powerHistory.current = [...powerHistory.current.slice(-30), data.totalPower]
        tempHistory.current = [...tempHistory.current.slice(-30), data.avgTemp]
    }, [data])

    const allDevices = data
        ? [...data.devices.gpus, ...data.devices.storage, ...data.devices.networking, ...data.devices.crac]
        : []

    const pue = data
        ? (() => {
            const itPower = [...data.devices.gpus, ...data.devices.storage, ...data.devices.networking]
                .reduce((s, d) => s + d.power, 0)
            const coolPower = data.devices.crac.reduce((s, d) => s + d.power, 0)
            return ((itPower + coolPower) / itPower).toFixed(2)
        })()
        : "—"

    return (
        <div style={{
            minHeight: "100vh",
            background: "#080c10",
            color: "#e8eaed",
            fontFamily: "'DM Mono', 'JetBrains Mono', monospace",
            padding: "2rem",
        }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@600;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .device-row { transition: background 0.2s; }
        .device-row:hover { background: rgba(255,255,255,0.03) !important; }
        .metric-card { animation: fadeIn 0.4s ease both; }
      `}</style>

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: "#fff" }}>
                        ARAVOLTA
                    </h1>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, letterSpacing: "0.08em" }}>
                        DATA CENTER TELEMETRY
                    </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{
                        width: 7, height: 7, borderRadius: "50%",
                        background: connected ? "#00e5a0" : "#ff4d4d",
                        boxShadow: connected ? "0 0 8px #00e5a0" : "0 0 8px #ff4d4d",
                        animation: connected ? "pulse 2s infinite" : "none",
                        display: "inline-block"
                    }} />
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
                        {connected ? "LIVE" : "DISCONNECTED"}
                    </span>
                    {data && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>
                            T+{data.tick}s
                        </span>
                    )}
                </div>
            </div>

            {!data && (
                <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                    Waiting for telemetry stream...
                </div>
            )}

            {data && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: "1.5rem" }}>
                        {[
                            { label: "TOTAL POWER", value: (data.totalPower / 1000).toFixed(1) + " kW", history: powerHistory.current, color: "#4d9fff", sub: "across all racks" },
                            { label: "AVG TEMP", value: data.avgTemp.toFixed(1) + "°C", history: tempHistory.current, color: "#ff6b6b", sub: "inlet average" },
                            { label: "AVG UTIL", value: data.avgUtil.toFixed(0) + "%", history: [], color: "#f5a623", sub: "compute utilization" },
                            { label: "PUE", value: pue, history: [], color: "#00e5a0", sub: "power effectiveness" },
                        ].map((m, i) => (
                            <div key={m.label} className="metric-card" style={{
                                animationDelay: `${i * 0.08}s`,
                                background: "#0d1117",
                                border: "0.5px solid rgba(255,255,255,0.07)",
                                borderRadius: 8,
                                padding: "14px 16px",
                                display: "flex", flexDirection: "column", gap: 6
                            }}>
                                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{m.label}</span>
                                <span style={{ fontSize: 24, fontWeight: 500, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</span>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{m.sub}</span>
                                    {m.history.length > 1 && <MiniSparkline values={m.history} color={m.color} />}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        background: "#0d1117",
                        border: "0.5px solid rgba(255,255,255,0.07)",
                        borderRadius: 8,
                        overflow: "hidden"
                    }}>
                        <div style={{ padding: "12px 16px", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>DEVICE TELEMETRY — {allDevices.length} NODES</span>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                                    {["", "DEVICE", "TYPE", "POWER (W)", "TEMP (°C)", "UTILIZATION"].map((h, i) => (
                                        <th key={i} style={{
                                            padding: "8px 16px", textAlign: "left",
                                            fontSize: 10, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em", fontWeight: 500
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {allDevices.map((d, i) => {
                                    const isHot = d.temp > 42
                                    const isOverloaded = d.util > 90
                                    return (
                                        <tr key={d.Device} className="device-row" style={{
                                            borderBottom: i < allDevices.length - 1 ? "0.5px solid rgba(255,255,255,0.04)" : "none",
                                            animationDelay: `${i * 0.04}s`
                                        }}>
                                            <td style={{ padding: "10px 16px 10px 16px", width: 28 }}>
                                                <StatusDot ok={!isHot && !isOverloaded} />
                                            </td>
                                            <td style={{ padding: "10px 8px", fontWeight: 500, color: "#fff", letterSpacing: "0.02em" }}>{d.Device}</td>
                                            <td style={{ padding: "10px 8px", color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{d.Type}</td>
                                            <td style={{ padding: "10px 8px", color: isOverloaded ? "#ff6b6b" : "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
                                                {d.power.toLocaleString()}
                                            </td>
                                            <td style={{ padding: "10px 8px", color: isHot ? "#ff6b6b" : "rgba(255,255,255,0.6)", fontVariantNumeric: "tabular-nums" }}>
                                                {d.temp.toFixed(1)}
                                            </td>
                                            <td style={{ padding: "10px 16px 10px 8px" }}>
                                                <UtilBar value={d.util} />
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    )
}