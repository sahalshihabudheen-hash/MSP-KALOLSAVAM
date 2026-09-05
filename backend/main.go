package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Simple CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	initDB()

	mux := http.NewServeMux()

	// Generic mux router
	mux.HandleFunc("/api/events", handleEvents)
	mux.HandleFunc("/api/events/", handleEventSingle)

	mux.HandleFunc("/api/registrations", handleRegistrations)
	mux.HandleFunc("/api/registrations/", handleRegistrationSingle)

	mux.HandleFunc("/api/sampoorna", handleSampoorna)
	mux.HandleFunc("/api/settings", handleSettings)
	
	mux.HandleFunc("/api/gallery", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" || (r.Method == "POST" && r.URL.Query().Get("albumId") == "") {
			handleGallery(w, r)
		}
	})
	mux.HandleFunc("/api/gallery/", func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if strings.HasPrefix(path, "/api/gallery/image") {
			handleGalleryImage(w, r)
		} else {
			handleGalleryAlbum(w, r)
		}
	})

	mux.HandleFunc("/api/halloffame", handleHallOfFame)
	mux.HandleFunc("/api/halloffame/", handleHallOfFameSingle)

	// Static file server for uploads - same dir as binary for VPS reliability
	uploadsDir := filepath.Join(filepath.Dir(func() string { exe, _ := os.Executable(); return exe }()), "uploads")
	os.MkdirAll(uploadsDir, 0755)
	fs := http.FileServer(http.Dir(uploadsDir))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fs))

	// Upload API
	mux.HandleFunc("/api/upload", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			sendError(w, 405, "Method not allowed")
			return
		}
		
		r.ParseMultipartForm(50 << 20) // 50 MB
		file, handler, err := r.FormFile("image")
		if err != nil {
			sendError(w, 400, "Error Retrieving the File")
			return
		}
		defer file.Close()

		filename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), handler.Filename)
		filename = strings.ReplaceAll(filename, " ", "_")
		
		dst, err := os.Create(filepath.Join(uploadsDir, filename))
		if err != nil {
			sendError(w, 500, "Error writing the file")
			return
		}
		defer dst.Close()
		
		io.Copy(dst, file)
		
		sendJSON(w, 200, map[string]string{"url": "/uploads/" + filename})
	})

	// Serve static files for the React frontend (SPA)
	distDir := filepath.Join(filepath.Dir(func() string { exe, _ := os.Executable(); return exe }()), "dist")
	fsDist := http.FileServer(http.Dir(distDir))
	
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Ignore /api and /uploads routes so they don't get swallowed
		if strings.HasPrefix(r.URL.Path, "/api/") || strings.HasPrefix(r.URL.Path, "/uploads/") {
			http.NotFound(w, r)
			return
		}

		// Try to find the file
		path := filepath.Join(distDir, filepath.Clean(r.URL.Path))
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			fsDist.ServeHTTP(w, r)
			return
		}

		// Fallback to index.html for SPA routing
		http.ServeFile(w, r, filepath.Join(distDir, "index.html"))
	})

	fmt.Println("🚀 Unified Go Server running on port 8080 (Serving API & Frontend)")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(mux)))
}
