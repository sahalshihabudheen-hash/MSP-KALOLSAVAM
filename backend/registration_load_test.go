package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

func TestConcurrentRegistrationLocking(t *testing.T) {
	// 1. Initialize the temp database
	// (initDB uses os.Executable() which will be in the /tmp/go-build dir during tests, so this is safe)
	initDB()

	// 2. Setup the test server with the exact handler used in production
	mux := http.NewServeMux()
	mux.HandleFunc("/api/registrations", handleRegistrations)
	server := httptest.NewServer(mux)
	defer server.Close()

	// 3. Define concurrency parameters
	numRequests := 100
	var successCount int32
	var failCount int32
	var wg sync.WaitGroup

	// 4. Fire concurrent requests
	fmt.Printf("🚀 Firing %d concurrent registration requests to stress test db.json locking...\n", numRequests)
	
	startTime := time.Now()
	for i := 0; i < numRequests; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			// Create a mock registration payload
			payload := RegistrationEntry{
				FullName:   fmt.Sprintf("Stress Test Student %d", id),
				ClassGrade: "10",
				Division:   "A",
				Category:   "HS",
				ItemNames:  []string{"Load Test Item"},
				Date:       time.Now().Format(time.RFC3339),
			}
			
			body, _ := json.Marshal(payload)

			// Send POST request
			resp, err := http.Post(server.URL+"/api/registrations", "application/json", bytes.NewBuffer(body))
			if err != nil {
				atomic.AddInt32(&failCount, 1)
				return
			}
			defer resp.Body.Close()

			if resp.StatusCode == 201 {
				atomic.AddInt32(&successCount, 1)
			} else {
				atomic.AddInt32(&failCount, 1)
			}
		}(i)
	}

	// 5. Wait for all goroutines to finish
	wg.Wait()
	duration := time.Since(startTime)

	// 6. Verify results
	fmt.Printf("⏱️  Stress test completed in %v\n", duration)
	fmt.Printf("✅ Successful HTTP Requests: %d\n", successCount)
	fmt.Printf("❌ Failed HTTP Requests: %d\n", failCount)

	// Validate DB lock integrity
	dbLock.RLock()
	defer dbLock.RUnlock()
	
	// Because other items might exist from previous tests in the temp dir, we check if the exact count is added.
	// But actually, initDB starts fresh if no file exists.
	actualRegistrations := len(appDB.Registrations)
	fmt.Printf("💾 Total registrations in db.json: %d\n", actualRegistrations)

	if failCount > 0 {
		t.Errorf("Expected 0 failures, got %d", failCount)
	}

	if actualRegistrations < int(successCount) {
		t.Errorf("Database corruption detected! DB count (%d) is less than successful requests (%d). The sync.RWMutex failed.", actualRegistrations, successCount)
	}
}
