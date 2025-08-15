package auth

import (
	"github.com/archellir/denshimon/internal/database"
)

// DatabaseAdapter wraps SQLiteDB to implement DatabaseClient interface
type DatabaseAdapter struct {
	db *database.SQLiteDB
}

// NewDatabaseAdapter creates a new database adapter
func NewDatabaseAdapter(db *database.SQLiteDB) *DatabaseAdapter {
	return &DatabaseAdapter{db: db}
}

func (a *DatabaseAdapter) GetUser(username string) (*DatabaseUser, error) {
	user, err := a.db.GetUser(username)
	if err != nil {
		return nil, err
	}

	return &DatabaseUser{
		ID:           user.ID,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		Role:         user.Role,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (a *DatabaseAdapter) GetUserByID(userID string) (*DatabaseUser, error) {
	user, err := a.db.GetUserByID(userID)
	if err != nil {
		return nil, err
	}

	return &DatabaseUser{
		ID:           user.ID,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		Role:         user.Role,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (a *DatabaseAdapter) CreateUser(username, passwordHash, role string) (*DatabaseUser, error) {
	user, err := a.db.CreateUser(username, passwordHash, role)
	if err != nil {
		return nil, err
	}

	return &DatabaseUser{
		ID:           user.ID,
		Username:     user.Username,
		PasswordHash: user.PasswordHash,
		Role:         user.Role,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}, nil
}

func (a *DatabaseAdapter) UpdateUser(userID, username, passwordHash, role string) error {
	return a.db.UpdateUser(userID, username, passwordHash, role)
}

func (a *DatabaseAdapter) DeleteUser(userID string) error {
	return a.db.DeleteUser(userID)
}

func (a *DatabaseAdapter) ListUsers() ([]*DatabaseUser, error) {
	users, err := a.db.ListUsers()
	if err != nil {
		return nil, err
	}

	result := make([]*DatabaseUser, len(users))
	for i, user := range users {
		result[i] = &DatabaseUser{
			ID:           user.ID,
			Username:     user.Username,
			PasswordHash: user.PasswordHash,
			Role:         user.Role,
			CreatedAt:    user.CreatedAt,
			UpdatedAt:    user.UpdatedAt,
		}
	}

	return result, nil
}
