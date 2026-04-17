export const devices = {
    gpus: [
        {
            Device: "gpu-rack-01",
            Type: "gpu-server",
            Base_power: 3200,
            Base_temp: 38,
            Base_util: 82
        },
        {
            Device: "gpu-rack-02",
            Type: "gpu-server",
            Base_power: 3100,
            Base_temp: 37,
            Base_util: 78
        },
        {
            Device: "gpu-rack-03",
            Type: "gpu-server",
            Base_power: 3400,
            Base_temp: 40,
            Base_util: 88
        },
        {
            Device: "gpu-rack-04",
            Type: "gpu-server",
            Base_power: 2900,
            Base_temp: 36,
            Base_util: 71
        }],
    storage: [
        {
            Device: "star-01",
            Type: "storage",
            Base_power: 420,
            Base_temp: 28,
            Base_util: 45
        },
        {
            Device: "star-02",
            Type: "storage",
            Base_power: 390,
            Base_temp: 27,
            Base_util: 42
        },
    ],
    networking: [
        {
            Device: "net-01",
            Type: "networking",
            Base_power: 280,
            Base_temp: 32,
            Base_util: 60
        },
    ],
    crac: [
        {
            Device: "cool-01",
            Type: "CRAC Unit",
            Base_power: 1800,
            Base_temp: 18,
            Base_util: 70
        },
    ]
}


export function load(time: number) {
    return 0.85 + 0.15 * Math.sin(time / 20 * Math.PI)
}

export function af() {
    return 1 + Math.random() * 0.5;
}

export function jitter(range: number) {
    return (Math.random() - 0.5) * 2 * range
}

export function power(basePower: number, time: number) {
    return Math.round(basePower * load(time) * af() + jitter(basePower * 3 / 100))
}

export function temp(baseTemp: number, time: number) {
    return (baseTemp * (0.9 + 0.1 * load(time)) * af()) + jitter(1.2)
}

export function util(baseUtil: number, time: number) {
    return Math.max(0, Math.min(99, Math.round(baseUtil * load(time) * af() + jitter(5))))
}
