package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Username     string    `gorm:"uniqueIndex"`
	Email        string    `gorm:"uniqueIndex"`
	PasswordHash string
	CreatedAt    time.Time
}

type Friendship struct {
	UserID1      uuid.UUID `gorm:"type:uuid;primary_key"`
	UserID2      uuid.UUID `gorm:"type:uuid;primary_key"`
	Status       string    `gorm:"type:varchar(20)"` // pending, accepted
	SharedStreak int
}

type Session struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	User1ID         uuid.UUID `gorm:"type:uuid"`
	User2ID         *uuid.UUID `gorm:"type:uuid"` // Nullable for when waiting
	Mode            string    `gorm:"type:varchar(20)"` // study, sprint, arena
	Status          string    `gorm:"type:varchar(20)"` // active, completed, abandoned
	DurationMinutes int
	StartedAt       time.Time
	EndedAt         *time.Time
}

type Task struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	SessionID   uuid.UUID `gorm:"type:uuid"`
	UserID      uuid.UUID `gorm:"type:uuid"`
	Description string
	IsCompleted bool
}

type SessionDebrief struct {
	SessionID   uuid.UUID `gorm:"type:uuid;primary_key"`
	UserID      uuid.UUID `gorm:"type:uuid;primary_key"`
	FocusRating string    `gorm:"type:varchar(10)"` // red, yellow, green
	Notes       string
}

func Migrate(db *gorm.DB) {
	if db != nil {
		db.AutoMigrate(&User{}, &Friendship{}, &Session{}, &Task{}, &SessionDebrief{})
	}
}
