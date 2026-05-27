package database

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB    *gorm.DB
	Redis *redis.Client
	Ctx   = context.Background()
)

func ConnectPostgres() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		host := os.Getenv("DB_HOST")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")

		if host == "" {
			host = "localhost"
			user = "user"
			password = "password"
			dbname = "syncspace"
		}
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=5432 sslmode=disable TimeZone=UTC", host, user, password, dbname)
	}
	
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Println("Could not connect to Postgres, skipping for now:", err)
		return
	}

	DB = db
	log.Println("Connected to PostgreSQL successfully")
}

func ConnectRedis() {
	redisUrl := os.Getenv("REDIS_URL")
	
	var opts *redis.Options
	var err error

	if redisUrl != "" {
		opts, err = redis.ParseURL(redisUrl)
		if err != nil {
			log.Println("Invalid REDIS_URL:", err)
			return
		}
	} else {
		host := os.Getenv("REDIS_HOST")
		if host == "" {
			host = "localhost:6379"
		}
		opts = &redis.Options{
			Addr: host,
		}
	}

	client := redis.NewClient(opts)

	_, err = client.Ping(Ctx).Result()
	if err != nil {
		log.Println("Could not connect to Redis, skipping for now:", err)
		return
	}

	Redis = client
	log.Println("Connected to Redis successfully")
}
