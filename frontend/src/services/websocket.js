import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let stompClient = null

export function connectWebSocket() {
  if (stompClient?.connected) return

  stompClient = new Client({
    webSocketFactory: () => new SockJS('/ws'),
    onConnect: () => {
      console.log('WebSocket connected')
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected')
    },
    onStompError: (frame) => {
      console.error('STOMP error:', frame.headers.message)
    },
    reconnectDelay: 5000,
  })

  stompClient.activate()
}

export function subscribe(topic, callback) {
  if (!stompClient) {
    connectWebSocket()
  }

  const waitAndSubscribe = () => {
    if (stompClient?.connected) {
      const subscription = stompClient.subscribe(topic, (message) => {
        callback(JSON.parse(message.body))
      })
      return () => subscription.unsubscribe()
    }

    // Wait for connection
    return new Promise((resolve) => {
      const originalOnConnect = stompClient.onConnect
      stompClient.onConnect = (frame) => {
        if (originalOnConnect) originalOnConnect(frame)
        const subscription = stompClient.subscribe(topic, (message) => {
          callback(JSON.parse(message.body))
        })
        resolve(() => subscription.unsubscribe())
      }
    })
  }

  return waitAndSubscribe()
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate()
    stompClient = null
  }
}
