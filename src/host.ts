const PROTOCOL_VERSION = 1

let port: MessagePort | null = null
let connecting: Promise<{ productId: string }> | null = null

export class NotEmbeddedError extends Error {
    constructor() {
        super('This page must be loaded inside an iframe by the Dodo SDK.')
        this.name = 'NotEmbeddedError'
    }
}

export function connectToHost(): Promise<{ productId: string }> {
    if (connecting) return connecting

    connecting = new Promise((resolve, reject) => {
        if (window.parent === window) {
            reject(new NotEmbeddedError())
            return
        }

        function onMessage(e: MessageEvent) {
            if (e.source !== window.parent) return
            const d = e.data
            if (!d || d.v !== PROTOCOL_VERSION || d.type !== 'init') return
            if (typeof d.payload?.productId !== 'string' || !e.ports[0]) return

            window.removeEventListener('message', onMessage)
            port = e.ports[0]
            resolve({ productId: d.payload.productId })
        }

        window.addEventListener('message', onMessage)
        window.parent.postMessage({ v: PROTOCOL_VERSION, type: 'ready' }, '*')
    })

    return connecting
}

export function sendToHost(type: string, payload?: Record<string, unknown>) {
    port?.postMessage({ v: PROTOCOL_VERSION, type, payload })
}