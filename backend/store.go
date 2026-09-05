package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

var (
	dbLock sync.RWMutex
	appDB  Database
	dbPath string
)

// getDataDir returns the directory for data storage.
// On VPS: same folder as the binary. Always reliable regardless of cwd.
func getDataDir() string {
	// Try to use the directory of the running executable
	exe, err := os.Executable()
	if err == nil {
		return filepath.Join(filepath.Dir(exe), "data")
	}
	// Fallback: use current working directory
	cwd, _ := os.Getwd()
	return filepath.Join(cwd, "data")
}

func initDB() {
	dataDir := getDataDir()
	dbPath = filepath.Join(dataDir, "db.json")

	// Create data directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		fmt.Printf("WARNING: Could not create data directory at %s: %v\n", dataDir, err)
	}

	// Initialize with defaults
	appDB = Database{
		Events:        make(map[string]KalolsavamEvent),
		Registrations: make(map[string]RegistrationEntry),
		Sampoorna:     []SampoornaStudent{},
		Settings: SystemSettings{
			RegistrationOpen: true,
			StartDate:        time.Now().Format("2006-01-02"),
			EndDate:          time.Now().AddDate(0, 0, 7).Format("2006-01-02"),
		},
		Gallery:    make(map[string]GalleryAlbum),
		HallOfFame: make(map[string]HallOfFameEntry),
	}

	// Try to load existing db
	if _, err := os.Stat(dbPath); err == nil {
		data, err := os.ReadFile(dbPath)
		if err == nil {
			if err = json.Unmarshal(data, &appDB); err != nil {
				fmt.Println("Warning: Failed to parse db.json, starting fresh.")
			} else {
				fmt.Printf("✅ Database loaded from: %s\n", dbPath)
			}
		}
	} else {
		fmt.Printf("📁 No database found, creating new one at: %s\n", dbPath)
		saveDB()
	}

	// Ensure maps are initialized (in case JSON had nulls)
	if appDB.Events == nil        { appDB.Events = make(map[string]KalolsavamEvent) }
	if appDB.Registrations == nil { appDB.Registrations = make(map[string]RegistrationEntry) }
	if appDB.Gallery == nil       { appDB.Gallery = make(map[string]GalleryAlbum) }
	if appDB.HallOfFame == nil    { appDB.HallOfFame = make(map[string]HallOfFameEntry) }
	if appDB.Sampoorna == nil     { appDB.Sampoorna = []SampoornaStudent{} }
}

func saveDB() error {
	data, err := json.MarshalIndent(appDB, "", "  ")
	if err != nil {
		return err
	}
	// Write to temp file first, then rename (atomic write - prevents corruption)
	tmpPath := dbPath + ".tmp"
	if err := os.WriteFile(tmpPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write temp db: %w", err)
	}
	if err := os.Rename(tmpPath, dbPath); err != nil {
		return fmt.Errorf("failed to rename temp db: %w", err)
	}
	return nil
}
