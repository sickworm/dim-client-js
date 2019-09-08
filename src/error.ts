
class ClientError extends Error {
    readonly errorCode: number

    constructor(errorCode: number, errorMsg?: string) {
        if (errorMsg) {
            super(`Storage Error errorCode: ${errorCode}, errorMsg: ${errorMsg}`)
        } else {
            super(`Storage Error errorCode: ${errorCode}`)
        }
        this.errorCode = errorCode
    }
}

class StateError {
    static readonly STATION_NOT_CONNECTED = 20000;
}

export { ClientError, StateError }