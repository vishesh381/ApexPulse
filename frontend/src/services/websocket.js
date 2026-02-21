import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let stompClient = null

export function connectWebSocket(onMessage) {
  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    onConnect: () => {
      console.log('WebSocket connected')
      stompClient.subscribe('/topic/test-progress', (message) => {
        onMessage(JSON.parse(message.body))
      })
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message)
    },
  })

  stompClient.activate()
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate()
  }
}
