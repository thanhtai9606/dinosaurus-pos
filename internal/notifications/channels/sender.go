package channels

import "context"

type Message struct {
	Subject   string
	Body      string
	HTMLBody  string
	ToEmail   string
	EventType string
	Data      map[string]string
}

type Sender interface {
	Send(ctx context.Context, msg Message) error
}