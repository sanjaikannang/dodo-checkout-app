const SUCCESS_CARD = '4242424242424242'
const DECLINE_CARD = '4000000000000002'
const RETRY_CARD = '4000000000000341'

export type PaymentResult =
    | { outcome: 'succeeded'; sessionId: string }
    | { outcome: 'declined'; message: string }
    | { outcome: 'networkError' }

export async function fakeCharge(
    cardNumber: string,
    attemptsForThisCard: number,
): Promise<PaymentResult> {
    const digits = cardNumber.replace(/\s+/g, '')

    // Simulated latency so "processing" is actually visible, not instant
    await new Promise((r) => setTimeout(r, 900))

    if (digits === SUCCESS_CARD) {
        return { outcome: 'succeeded', sessionId: `sess_${Date.now()}` }
    }

    if (digits === DECLINE_CARD) {
        return { outcome: 'declined', message: 'Your card was declined. Try a different card.' }
    }

    if (digits === RETRY_CARD) {
        // First attempt fails as a network-style error, second attempt succeeds
        if (attemptsForThisCard === 0) {
            return { outcome: 'networkError' }
        }
        return { outcome: 'succeeded', sessionId: `sess_${Date.now()}` }
    }

    // Anything else typed in: treat as a plain decline rather than a dead end
    return { outcome: 'declined', message: 'Your card was declined. Try a different card.' }
}