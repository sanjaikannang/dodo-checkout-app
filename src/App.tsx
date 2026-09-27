import { useEffect, useState } from 'react'
import { connectToHost, sendToHost } from './host'

export default function App() {
  const [productId, setProductId] = useState<string | null>(null)
  const [status, setStatus] = useState('Connecting…')

  useEffect(() => {
    connectToHost()
      .then(({ productId }) => { setProductId(productId); setStatus('Connected') })
      .catch(() => setStatus('Not embedded'))
  }, [])

  return (
    <div className="p-6 space-y-4">
      <p className="text-sm text-gray-500">{status}</p>
      {productId && <p className="font-mono">productId: {productId}</p>}
      <div className="flex gap-2">
        <button className="rounded bg-black px-3 py-2 text-white"
          onClick={() => sendToHost('success', { sessionId: 'sess_test' })}>
          Send success
        </button>
        <button className="rounded border px-3 py-2"
          onClick={() => sendToHost('close', { reason: 'dismissed' })}>
          Close
        </button>
      </div>
    </div>
  )
}