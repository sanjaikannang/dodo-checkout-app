export function formatCardNumber(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
}

export function formatExpiry(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    if (digits.length < 3) return digits
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function isExpiryValid(expiry: string): boolean {
    const match = expiry.match(/^(\d{2})\/(\d{2})$/)
    if (!match) return false
    const month = parseInt(match[1], 10)
    const year = 2000 + parseInt(match[2], 10)
    if (month < 1 || month > 12) return false
    const now = new Date()
    const expiryDate = new Date(year, month) // first of the month AFTER expiry
    return expiryDate > now
}

export function isEmailValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}