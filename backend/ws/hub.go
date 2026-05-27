package ws

import (
	"log"
)

type Message struct {
	Data   []byte
	Room   string
	Sender *Client
}

type Hub struct {
	// Registered clients organized by room.
	rooms map[string]map[*Client]bool

	// Inbound messages from the clients.
	broadcast chan *Message

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan *Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		rooms:      make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			if _, ok := h.rooms[client.room]; !ok {
				h.rooms[client.room] = make(map[*Client]bool)
			}
			h.rooms[client.room][client] = true
			log.Printf("Client connected to room %s. Total clients in room: %d\n", client.room, len(h.rooms[client.room]))
		case client := <-h.unregister:
			if clients, ok := h.rooms[client.room]; ok {
				if _, ok := clients[client]; ok {
					delete(clients, client)
					close(client.send)
					if len(clients) == 0 {
						delete(h.rooms, client.room)
					}
					log.Printf("Client disconnected from room %s.\n", client.room)
				}
			}
		case message := <-h.broadcast:
			if clients, ok := h.rooms[message.Room]; ok {
				for client := range clients {
					if client == message.Sender {
						continue // Do not broadcast to the sender
					}
					select {
					case client.send <- message.Data:
					default:
						close(client.send)
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.rooms, message.Room)
						}
					}
				}
			}
		}
	}
}
