import * as mkm from 'dim-mkm-js'
import * as dkd from 'dim-dkd-js'
import * as core from 'dim-core-js'
import { Client } from '../src/client'

import '../test/init_database'
import { resolve } from 'dns'

describe('cli.ts', () => {

    test('test', () => {
        expect(1 + 1).toEqual(2)
    })

    test('test station echo', () => {
        let sender = "moki@4WDfe3zZ4T7opFSi3iDAKiuTnUHjxmXekk"
        let receiver = "gsp-s001@x5Zh9ixt8ECr59XLye1y5WWfaX4fcoaaSC"
        
        // make sure local station is running
        console.log('make sure local station is running')
        let client = new Client(mkm.ID.fromString(sender))
        return new Promise((resolve, reject) => {
            client.connect('127.0.0.1', 9394, async (content: dkd.Content) => {
                console.log('test station echo receive ' + JSON.stringify(content))
                expect(content.type).toEqual(dkd.MessageType.Text)
                expect((content as core.TextContent).text).toEqual('123')
                await client.disconnect()
                resolve()
            }).then(() => {
                client.sendText(receiver, '123')
            }).catch(e => {
                reject(e)
            })
        })
    })
})