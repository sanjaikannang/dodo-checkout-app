export type Status =
    | 'connecting'
    | 'loadFailed'
    | 'invalidProduct'
    | 'ready'
    | 'processing'
    | 'declined'
    | 'networkError'
    | 'succeeded'

export interface FormState {
    email: string
    cardNumber: string
    expiry: string
    cvc: string
}

export interface CheckoutState {
    status: Status
    form: FormState
    errorMessage: string | null
    attemptsForCard: Record<string, number>
    product: { name: string; price: string } | null
}

export type Action =
    | { type: 'CONNECTED' }
    | { type: 'CONNECT_FAILED' }
    | { type: 'FIELD_CHANGE'; field: keyof FormState; value: string }
    | { type: 'SUBMIT' }
    | { type: 'DECLINED'; message: string }
    | { type: 'NETWORK_ERROR' }
    | { type: 'SUCCEEDED' }
    | { type: 'RESET_TO_READY' }
    | { type: 'PRODUCT_FOUND'; product: { name: string; price: string } }
    | { type: 'PRODUCT_NOT_FOUND' }