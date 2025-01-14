package rpc

import "net/rpc"

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

type Client struct {
	*rpc.Client
}

func NewClient(serverAddress, port string) (*Client, error) {
	client, err := rpc.DialHTTP("tcp", serverAddress+port)
	return &Client{client}, err
}

func (c *Client) CallStoreTVShow(args StoreTVArgs, reply *StoreTVReply) error {
	return c.Call("Something.StoreTVShow", args, reply)
}
