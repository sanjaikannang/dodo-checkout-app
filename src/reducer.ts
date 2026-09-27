import type { CheckoutState, Action } from './types'

export const initialState: CheckoutState = {
    status: 'connecting',
    form: { email: '', cardNumber: '', expiry: '', cvc: '' },
    errorMessage: null,
    attemptsForCard: {},
    product: null,
}

export function reducer(state: CheckoutState, action: Action): CheckoutState {
    switch (action.type) {        

        case 'CONNECT_FAILED':
            return { ...state, status: 'loadFailed' }

        case 'FIELD_CHANGE':
            // Typing during a decline/network error clears the message so it doesn't feel stuck
            return {
                ...state,
                form: { ...state.form, [action.field]: action.value },
                errorMessage: null,
            }

        case 'SUBMIT':
            // Guards double-submit: only "ready" can move to "processing"
            if (state.status !== 'ready' && state.status !== 'declined' && state.status !== 'networkError') {
                return state
            }
            return { ...state, status: 'processing', errorMessage: null }

        case 'DECLINED':
            return { ...state, status: 'declined', errorMessage: action.message }

        case 'NETWORK_ERROR':
            return {
                ...state,
                status: 'networkError',
                errorMessage: "Connection lost. You haven't been charged. Please try again.",
            }

        case 'SUCCEEDED':
            return { ...state, status: 'succeeded' }

        case 'RESET_TO_READY':
            return { ...state, status: 'ready', errorMessage: null }

        case 'PRODUCT_FOUND':
            return { ...state, status: 'ready', product: action.product }

        case 'PRODUCT_NOT_FOUND':
            return { ...state, status: 'invalidProduct' }

        default:
            return state
    }
}