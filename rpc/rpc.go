package rpc

import (
	"errors"
	"net"
	"net/http"
	"net/rpc"
	"time"
)

type StoreTVArgs struct {
	TVData TVData
}

type TVData struct {
	Name          string
	SeasonNumber  int
	EpisodeNumber int
	ReleaseYear   int
	FilePath      string
}

type StoreTVReply struct{}

type StoreMovieArgs struct {
	MovieData MovieData
}

type MovieData struct {
	Name        string
	ReleaseYear int
	FilePath    string
}

type StoreMovieReply struct{}

type Client struct {
	*rpc.Client
}

func NewClient(serverAddress, port string) (*Client, error) {
	client, err := rpc.DialHTTP("tcp", serverAddress+port)
	return &Client{client}, err
}

func (c *Client) Call(proc string, args any, reply any) error {
	ch := make(chan *rpc.Call)
	c.Go(proc, args, reply, ch)

	select {
	case <-ch:
		return nil
	case <-time.After(time.Second * 5):
		return errors.New("error calling procedure")
	}
}

func ListenAndServe(port string, handlers ...any) error {
	for _, h := range handlers {
		rpc.Register(h)
	}
	rpc.HandleHTTP()
	l, err := net.Listen("tcp", port)
	if err != nil {
		return err
	}
	go http.Serve(l, nil)
	return nil
}
