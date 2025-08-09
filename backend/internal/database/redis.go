package database

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisClient(url string) (*RedisClient, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	client := redis.NewClient(opts)
	ctx := context.Background()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisClient{
		client: client,
		ctx:    ctx,
	}, nil
}

func (r *RedisClient) Close() error {
	return r.client.Close()
}

func (r *RedisClient) Set(key string, value interface{}, expiration time.Duration) error {
	return r.client.Set(r.ctx, key, value, expiration).Err()
}

func (r *RedisClient) Get(key string) (string, error) {
	return r.client.Get(r.ctx, key).Result()
}

func (r *RedisClient) Delete(key string) error {
	return r.client.Del(r.ctx, key).Err()
}

func (r *RedisClient) Exists(key string) (bool, error) {
	n, err := r.client.Exists(r.ctx, key).Result()
	return n > 0, err
}

func (r *RedisClient) SetJSON(key string, value interface{}, expiration time.Duration) error {
	// For now, we'll use standard Set with string conversion
	// In production, use proper JSON marshaling
	return r.Set(key, fmt.Sprintf("%v", value), expiration)
}

func (r *RedisClient) GetJSON(key string, dest interface{}) error {
	// For now, return the string value
	// In production, use proper JSON unmarshaling
	_, err := r.Get(key)
	return err
}

// Session management
func (r *RedisClient) SetSession(sessionID string, userID string, expiration time.Duration) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Set(key, userID, expiration)
}

func (r *RedisClient) GetSession(sessionID string) (string, error) {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Get(key)
}

func (r *RedisClient) DeleteSession(sessionID string) error {
	key := fmt.Sprintf("session:%s", sessionID)
	return r.Delete(key)
}

// Cache operations
func (r *RedisClient) CacheSet(key string, value interface{}, ttl time.Duration) error {
	cacheKey := fmt.Sprintf("cache:%s", key)
	return r.SetJSON(cacheKey, value, ttl)
}

func (r *RedisClient) CacheGet(key string, dest interface{}) error {
	cacheKey := fmt.Sprintf("cache:%s", key)
	return r.GetJSON(cacheKey, dest)
}

func (r *RedisClient) CacheDelete(key string) error {
	cacheKey := fmt.Sprintf("cache:%s", key)
	return r.Delete(cacheKey)
}