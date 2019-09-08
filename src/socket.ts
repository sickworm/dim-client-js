import * as net from 'net'

enum SocketState {
    DISCONNECTED = 1,
    CONNECTING = 2,
    CONNECTED = 3
}

type OnReceiveListener = (object: any) => void
type OnDisconnectedPassiveListener = () => void

interface Socket {
    readonly host: string
    readonly port: number

    onDisconnectedPassive: OnDisconnectedPassiveListener | null
    onRecieve: OnReceiveListener | null
    
    getState(): SocketState
    isConnected(): boolean
    connect(): Promise<void>
    disconnect(): Promise<void>
    send(object: any): Promise<void>
}

class EmptySocket implements Socket {
    readonly host: string = ''
    readonly port: number = 0
    onDisconnectedPassive: OnDisconnectedPassiveListener | null = null
    onRecieve: OnReceiveListener | null = null
    
    getState(): SocketState {
        return SocketState.DISCONNECTED
    }

    isConnected(): boolean {
        return false;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {})
    }

    disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {})
    }

    send(object: any): Promise<any> {
        return new Promise((resolve, reject) => {})
    }
}

/**
 * TCP Socket for node.js
 */
class NodeSocket implements Socket {
    static readonly EMPTY_SOCKET = new NodeSocket('', 0)

    readonly host: string
    readonly port: number

    onDisconnectedPassive: OnDisconnectedPassiveListener | null = null
    onRecieve: OnReceiveListener | null = null

    private readonly _client: net.Socket
    private _state: SocketState = SocketState.DISCONNECTED

    constructor(host: string, port: number) {
        this.host = host
        this.port = port
        this._client = new net.Socket();
    }

    connect(): Promise<void> {
        console.log('Socket start');

        return new Promise((resolve, reject) => {
            this._state = SocketState.CONNECTING
            this._client.connect(this.port, this.host, () => {
                console.log('socket connected to the station');
                this._state = SocketState.CONNECTED
                resolve()

                this._client.on('timeout', () => {
                    console.log('Socket time out');
                    this._client.end()
                })
    
                this._client.on('data', (data: Buffer) => {
                    let stringData = data.toString('utf-8')
                    console.log('Socket receive: ' + stringData);
                    if (this.onRecieve) this.onRecieve(JSON.parse(stringData))
                })
            })

            this._client.on('error', (err) => {
                console.log('Socket connect failed', err);
                this._state = SocketState.DISCONNECTED
                reject(err)
            })

            this._client.on('close', () => {
                console.log('Socket closed passive');
                this._state = SocketState.DISCONNECTED
                if (this.onDisconnectedPassive) this.onDisconnectedPassive()
            })
        })
    }

    disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            // override passive listener
            this._client.on('close', () => {
                console.log('Socket closed on disconnect');
                this._state = SocketState.DISCONNECTED
                resolve()
            })
            this._client.end()
        })
    }

    send(data: Uint8Array | string): Promise<void> {
        // TODO server has ACK?
        return new Promise((resolve) => this._client.write(data, () => resolve()))
    }

    getState(): SocketState {
        return this._state
    }

    isConnected(): boolean {
        return this._state == SocketState.CONNECTED
    }
}

module Socket {
    export const EMPTY_SOCKET = new EmptySocket()
    export function createSocket(host: string, port: number) {
        if (isNode()) {
            return new NodeSocket(host, port)
        } else {
            throw Error('web socket not implemented yet!')
        }
    }

    function isNode(): boolean {
        // @ts-ignore
        return typeof(window) === 'undefined' || (window === global)
    }
}

export { Socket, SocketState, OnReceiveListener, OnDisconnectedPassiveListener }