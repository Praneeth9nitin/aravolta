import { WebSocketServer } from "ws"
import { devices, power, temp, util } from "./devices.js"

const wss = new WebSocketServer({ port: 8080 })

let tick = 0;

function getSnapShot() {
    const gpus = devices.gpus.map((d) => ({
        ...d,
        power: power(d.Base_power, tick),
        temp: temp(d.Base_temp, tick),
        util: util(d.Base_util, tick)
    }))
    const storage = devices.storage.map((d) => ({
        ...d,
        power: power(d.Base_power, tick),
        temp: temp(d.Base_temp, tick),
        util: util(d.Base_util, tick)
    }))
    const networking = devices.networking.map((d) => ({
        ...d,
        power: power(d.Base_power, tick),
        temp: temp(d.Base_temp, tick),
        util: util(d.Base_util, tick)
    }))
    const crac = devices.crac.map((d) => ({
        ...d,
        power: power(d.Base_power, tick),
        temp: temp(d.Base_temp, tick),
        util: util(d.Base_util, tick)
    }))

    const allDevices = [...gpus, ...storage, ...networking, ...crac]
    const count = allDevices.length;
    return {
        tick,
        timestamp: Date.now(),
        devices: {
            gpus,
            storage,
            networking,
            crac
        },
        totalPower: allDevices.reduce((acc, d) => acc + d.power, 0),
        avgTemp: allDevices.reduce((acc, d) => acc + d.temp, 0) / count,
        avgUtil: allDevices.reduce((acc, d) => acc + d.util, 0) / count
    }
}

setInterval(() => {
    tick++
    const snapshot = getSnapShot();
    wss.clients.forEach((client) => {
        client.send(JSON.stringify(snapshot))
    })
}, 1000);


wss.on("connection", (ws) => {
    ws.send(JSON.stringify(getSnapShot()))
})

