import * as mkm from 'dim-mkm-js'
import * as dkd from 'dim-dkd-js'
import * as core from 'dim-core-js'
import { Socket } from './socket'
import { ClientError, StateError } from './error'

type OnReceiveContentListener = (content: dkd.Content) => void

class Client {
    private readonly _transceiver = new core.Transceiver()

    readonly identifier: mkm.ID
    readonly user: mkm.LocalUser

    private _socket: Socket = Socket.EMPTY_SOCKET
    private _onReceiveContentlistener: OnReceiveContentListener | null = null

    constructor(identifier: mkm.ID) {
        this.identifier = identifier
        this.user = core.Barrack.getInstance().getLocalUser(identifier)
    }

    async connect(host: string, port: number, listener: OnReceiveContentListener): Promise<void> {
        await this.disconnect()

        this._onReceiveContentlistener = listener
        this._socket = Socket.createSocket(host, port)
        this._socket.onRecieve = (data: any) => {
            console.log(`transceiver onRecieve: ${JSON.stringify(data)}`)
            // TODO check cast to rMsg
            let rMsg = data as dkd.ReliableMessage
            let iMsg: dkd.InstantMessage = this._transceiver.verifyAndDecryptMessage(rMsg);
            console.log(`transceiver iMsg: ${JSON.stringify(iMsg.content)}`)
            if (this._onReceiveContentlistener) this._onReceiveContentlistener(iMsg.content)
        }
        return this._socket.connect()
    }

    disconnect(): Promise<void> {
        if (this._socket && this._socket.isConnected()) {
            return this._socket.disconnect()
        }
        return Promise.resolve()
    }

    sendText(receiver: string, text: string) {
        return this.send(receiver, core.Content.text(text))
    }

    send(receiver: string, content: dkd.Content): Promise<void[]> {
        this.checkConnected();
        let time = new Date().getTime() / 1000
        let iMsg: dkd.InstantMessage = { content, sender: this.identifier.toString(), receiver, time }
        let msgs = this._transceiver.packageMessage(iMsg)

        return Promise.all(msgs.map(m => {
            let data = JSON.stringify(m) + '\n'
            return this._socket.send(data)
        }))
    }

    private checkConnected() {
        if (!this._socket.isConnected()) {
            throw new ClientError(StateError.STATION_NOT_CONNECTED)
        }
    }
}

export { Client, OnReceiveContentListener }