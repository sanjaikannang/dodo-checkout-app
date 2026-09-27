import { useEffect, useReducer, useRef, useState } from 'react'
import { reducer, initialState } from './reducer'
import { fakeCharge } from './payment'
import { formatCardNumber, formatExpiry, isEmailValid, isExpiryValid } from './format'
import { lookupProduct } from './catalog'
import { sendToHost, connectToHost, NotEmbeddedError } from './host'

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [notEmbedded, setNotEmbedded] = useState(false)

  useEffect(() => {
    connectToHost()
      .then(({ productId }) => {
        const product = lookupProduct(productId)
        if (!product) {
          dispatch({ type: 'PRODUCT_NOT_FOUND' })
          sendToHost('error', { code: 'invalid_product', message: `Unknown product "${productId}"` })
          setTimeout(() => sendToHost('close', { reason: 'error' }), 1500)
          return
        }
        dispatch({ type: 'PRODUCT_FOUND', product })
      })
      .catch((err) => {
        if (err instanceof NotEmbeddedError) setNotEmbedded(true)
        dispatch({ type: 'CONNECT_FAILED' })
      })
  }, [])

  useEffect(() => {
    if (state.status === 'ready') firstFieldRef.current?.focus()
  }, [state.status])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') requestClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.status])

  function requestClose() {
    if (state.status === 'processing') {
      setConfirmingClose(true)
      return
    }
    sendToHost('close', { reason: 'dismissed' })
  }

  const { email, cardNumber, expiry, cvc } = state.form
  const formValid =
    isEmailValid(email) &&
    cardNumber.replace(/\s+/g, '').length === 16 &&
    isExpiryValid(expiry) &&
    cvc.length >= 3

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formValid || state.status === 'processing') return

    dispatch({ type: 'SUBMIT' })
    const digits = cardNumber.replace(/\s+/g, '')
    const attempts = state.attemptsForCard[digits] ?? 0

    const result = await fakeCharge(digits, attempts)
    state.attemptsForCard[digits] = attempts + 1 // tracked outside reducer, fine for this scale

    if (result.outcome === 'succeeded') {
      dispatch({ type: 'SUCCEEDED' })
      sendToHost('success', { sessionId: result.sessionId })
      setTimeout(() => sendToHost('close', { reason: 'completed' }), 1200)
    } else if (result.outcome === 'declined') {
      dispatch({ type: 'DECLINED', message: result.message })
    } else {
      dispatch({ type: 'NETWORK_ERROR' })
    }
  }

  if (state.status === 'connecting') {
    return <CenteredMessage text="Loading checkout…" />
  }

  if (state.status === 'loadFailed') {
    return (
      <CenteredMessage
        text={
          notEmbedded
            ? 'This page is meant to be opened inside the merchant demo, not directly.'
            : "Couldn't load checkout."
        }
      />
    )
  }

  if (state.status === 'invalidProduct') {
    return <CenteredMessage text="This product is not available." />
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>          
          <p className="text-sm text-gray-500">{state.product?.name}</p>
          <p className="text-lg font-semibold text-gray-900">{state.product?.price}</p>
        </div>
        <button
          onClick={requestClose}
          aria-label="Close checkout"
          className="rounded p-1 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </header>

      {state.status === 'succeeded' ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5">
          <p className="text-lg font-medium text-gray-900">Payment successful</p>
          <p className="text-sm text-gray-500">You'll be redirected shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5">
          {state.errorMessage && (
            <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.errorMessage}
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Email
            <input
              ref={firstFieldRef}
              type="email"
              value={email}
              onChange={(e) => dispatch({ type: 'FIELD_CHANGE', field: 'email', value: e.target.value })}
              className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Card number
            <input
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) =>
                dispatch({ type: 'FIELD_CHANGE', field: 'cardNumber', value: formatCardNumber(e.target.value) })
              }
              className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
              placeholder="4242 4242 4242 4242"
              autoComplete="cc-number"
              required
            />
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
              Expiry
              <input
                inputMode="numeric"
                value={expiry}
                onChange={(e) =>
                  dispatch({ type: 'FIELD_CHANGE', field: 'expiry', value: formatExpiry(e.target.value) })
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                placeholder="MM/YY"
                autoComplete="cc-exp"
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm text-gray-700">
              CVC
              <input
                inputMode="numeric"
                value={cvc}
                onChange={(e) =>
                  dispatch({
                    type: 'FIELD_CHANGE',
                    field: 'cvc',
                    value: e.target.value.replace(/\D/g, '').slice(0, 4),
                  })
                }
                className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                placeholder="123"
                autoComplete="cc-csc"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={!formValid || state.status === 'processing'}
            className="mt-2 rounded bg-gray-900 py-2.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {state.status === 'processing' ? 'Processing…' : `Pay ${state.product?.price}`}
          </button>

          <p className="text-center text-xs text-gray-400">
            Card details go to Dodo directly and are never shared with the merchant.
          </p>
        </form>
      )}

      {confirmingClose && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="mx-4 rounded-lg bg-white p-5 shadow-lg">
            <p className="text-sm text-gray-800">Payment is still processing. Close anyway?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmingClose(false)}
                className="rounded px-3 py-1.5 text-sm text-gray-600"
              >
                Stay
              </button>
              <button
                onClick={() => sendToHost('close', { reason: 'dismissed' })}
                className="rounded bg-red-600 px-3 py-1.5 text-sm text-white"
              >
                Close anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center px-5 text-sm text-gray-500">
      {text}
    </div>
  )
}