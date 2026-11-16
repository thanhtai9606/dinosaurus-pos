package channels

import "context"

type Message struct {
	Subject string
	Body    string
	ToEmail string
}

type Sender interface {
	Send(ctx context.Context, msg Message) error
}