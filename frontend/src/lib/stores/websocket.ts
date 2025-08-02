import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface WebSocketMessage {
	type: string;
	data?: any;
}

interface WebSocketState {
	connected: boolean;
	reconnecting: boolean;
	error: string | null;
	lastMessage: WebSocketMessage | null;
}

const initialState: WebSocketState = {
	connected: false,
	reconnecting: false,
	error: null,
	lastMessage: null
};

function createWebSocketStore() {
	const { subscribe, set, update } = writable<WebSocketState>(initialState);
	
	let ws: WebSocket | null = null;
	let reconnectAttempts = 0;
	let maxReconnectAttempts = 5;
	let reconnectInterval = 1000;
	let clientId: string | null = null;

	function connect() {
		if (!browser) return;
		
		try {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const wsUrl = `${protocol}//${window.location.host}/ws`;
			
			ws = new WebSocket(wsUrl);
			
			ws.onopen = () => {
				console.log('WebSocket connected');
				reconnectAttempts = 0;
				update(state => ({
					...state,
					connected: true,
					reconnecting: false,
					error: null
				}));
			};

			ws.onmessage = (event) => {
				try {
					const message: WebSocketMessage = JSON.parse(event.data);
					
					// Store client ID from connection message
					if (message.type === 'connection' && message.data?.clientId) {
						clientId = message.data.clientId;
					}
					
					update(state => ({
						...state,
						lastMessage: message
					}));

					// Emit custom events for different message types
					if (browser) {
						window.dispatchEvent(new CustomEvent(`ws-${message.type}`, {
							detail: message.data
						}));
					}
				} catch (error) {
					console.error('Failed to parse WebSocket message:', error);
				}
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				update(state => ({
					...state,
					connected: false
				}));
				
				// Attempt to reconnect
				if (reconnectAttempts < maxReconnectAttempts) {
					setTimeout(() => {
						reconnectAttempts++;
						update(state => ({ ...state, reconnecting: true }));
						connect();
					}, reconnectInterval * Math.pow(2, reconnectAttempts));
				} else {
					update(state => ({
						...state,
						error: 'Failed to reconnect to WebSocket'
					}));
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				update(state => ({
					...state,
					error: 'WebSocket connection error'
				}));
			};
		} catch (error) {
			console.error('Failed to create WebSocket connection:', error);
			update(state => ({
				...state,
				error: 'Failed to create WebSocket connection'
			}));
		}
	}

	function disconnect() {
		if (ws) {
			ws.close();
			ws = null;
		}
		
		set(initialState);
	}

	function send(message: WebSocketMessage) {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify(message));
		} else {
			console.warn('WebSocket is not connected');
		}
	}

	function subscribe(subscription: string) {
		send({
			type: 'subscribe',
			data: { subscription }
		});
	}

	function unsubscribe(subscription: string) {
		send({
			type: 'unsubscribe',
			data: { subscription }
		});
	}

	function ping() {
		send({ type: 'ping' });
	}

	return {
		subscribe,
		connect,
		disconnect,
		send,
		subscribe: subscribe,
		unsubscribe,
		ping
	};
}

export const websocketStore = createWebSocketStore();