package main

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"time"
)

func init() {
	rand.Seed(time.Now().UnixNano())
}

func generateID() string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, 20)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

// sendCachedJSON adds short cache headers for GET responses (10s in browser)
func sendCachedJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "private, max-age=10")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func sendError(w http.ResponseWriter, status int, message string) {
	sendJSON(w, status, map[string]string{"error": message})
}

// ---------------- EVENTS ----------------

func handleEvents(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	switch r.Method {
	case "GET":
		eventsList := []KalolsavamEvent{}
		for _, e := range appDB.Events {
			eventsList = append(eventsList, e)
		}
		sendCachedJSON(w, 200, eventsList)
	case "POST":
		var e KalolsavamEvent
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		e.ID = generateID()
		appDB.Events[e.ID] = e
		saveDB()
		sendJSON(w, 201, e)
	case "DELETE":
		// Clear all
		appDB.Events = make(map[string]KalolsavamEvent)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "All events deleted"})
	default:
		sendError(w, 405, "Method not allowed")
	}
}

func handleEventSingle(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/events/"):]
	dbLock.Lock()
	defer dbLock.Unlock()

	switch r.Method {
	case "PUT":
		var e KalolsavamEvent
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		if _, exists := appDB.Events[id]; !exists {
			sendError(w, 404, "Not found")
			return
		}
		e.ID = id
		appDB.Events[id] = e
		saveDB()
		sendJSON(w, 200, e)
	case "DELETE":
		delete(appDB.Events, id)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Deleted"})
	}
}

// ---------------- REGISTRATIONS ----------------

func handleRegistrations(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	switch r.Method {
	case "GET":
		list := []RegistrationEntry{}
		for _, reg := range appDB.Registrations {
			list = append(list, reg)
		}
		sendCachedJSON(w, 200, list)
	case "POST":
		var e RegistrationEntry
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		e.ID = generateID()
		if e.Date == "" {
			e.Date = time.Now().Format(time.RFC3339)
		}
		appDB.Registrations[e.ID] = e
		saveDB()
		sendJSON(w, 201, e)
	case "DELETE":
		appDB.Registrations = make(map[string]RegistrationEntry)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Cleared"})
	}
}

func handleRegistrationSingle(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/registrations/"):]
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "PUT" {
		var updates map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		reg, exists := appDB.Registrations[id]
		if !exists {
			sendError(w, 404, "Not found")
			return
		}
		
		// For simplicity, we decode updates by re-marshalling
		data, _ := json.Marshal(reg)
		var merged map[string]interface{}
		json.Unmarshal(data, &merged)
		for k, v := range updates {
			merged[k] = v
		}
		finalData, _ := json.Marshal(merged)
		json.Unmarshal(finalData, &reg)
		
		appDB.Registrations[id] = reg
		saveDB()
		sendJSON(w, 200, reg)
	} else if r.Method == "DELETE" {
		delete(appDB.Registrations, id)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Deleted"})
	}
}

// ---------------- SAMPOORNA ----------------

func handleSampoorna(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	switch r.Method {
	case "GET":
		sendCachedJSON(w, 200, appDB.Sampoorna)
	case "POST":
		var students []SampoornaStudent
		if err := json.NewDecoder(r.Body).Decode(&students); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		appDB.Sampoorna = append(appDB.Sampoorna, students...)
		saveDB()
		sendJSON(w, 201, map[string]string{"message": "Imported"})
	case "DELETE":
		appDB.Sampoorna = []SampoornaStudent{}
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Cleared"})
	}
}

// ---------------- SETTINGS ----------------

func handleSettings(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "GET" {
		sendCachedJSON(w, 200, appDB.Settings)
	} else if r.Method == "PUT" {
		var s SystemSettings
		if err := json.NewDecoder(r.Body).Decode(&s); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		appDB.Settings = s
		saveDB()
		sendJSON(w, 200, s)
	}
}

// ---------------- GALLERY ----------------

func handleGallery(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "GET" {
		list := []GalleryAlbum{}
		for _, g := range appDB.Gallery {
			if g.Images == nil {
				g.Images = []GalleryImage{}
			}
			list = append(list, g)
		}
		sendCachedJSON(w, 200, list)
	} else if r.Method == "POST" {
		var a GalleryAlbum
		if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		a.ID = generateID()
		if a.Images == nil {
			a.Images = []GalleryImage{}
		}
		appDB.Gallery[a.ID] = a
		saveDB()
		sendJSON(w, 201, a)
	}
}

func handleGalleryAlbum(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/gallery/"):]
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "DELETE" {
		delete(appDB.Gallery, id)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Deleted"})
	}
}

func handleGalleryImage(w http.ResponseWriter, r *http.Request) {
	albumID := r.URL.Query().Get("albumId")
	dbLock.Lock()
	defer dbLock.Unlock()

	album, exists := appDB.Gallery[albumID]
	if !exists {
		sendError(w, 404, "Album not found")
		return
	}

	if r.Method == "POST" {
		var img GalleryImage
		if err := json.NewDecoder(r.Body).Decode(&img); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		img.ID = generateID()
		album.Images = append(album.Images, img)
		appDB.Gallery[albumID] = album
		saveDB()
		sendJSON(w, 201, img)
	} else if r.Method == "DELETE" {
		imageID := r.URL.Query().Get("imageId")
		newImages := []GalleryImage{}
		for _, img := range album.Images {
			if img.ID != imageID {
				newImages = append(newImages, img)
			}
		}
		album.Images = newImages
		appDB.Gallery[albumID] = album
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Deleted"})
	}
}

// ---------------- HALL OF FAME ----------------

func handleHallOfFame(w http.ResponseWriter, r *http.Request) {
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "GET" {
		list := []HallOfFameEntry{}
		for _, h := range appDB.HallOfFame {
			list = append(list, h)
		}
		sendCachedJSON(w, 200, list)
	} else if r.Method == "POST" {
		var h HallOfFameEntry
		if err := json.NewDecoder(r.Body).Decode(&h); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		h.ID = generateID()
		appDB.HallOfFame[h.ID] = h
		saveDB()
		sendJSON(w, 201, h)
	}
}

func handleHallOfFameSingle(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/halloffame/"):]
	dbLock.Lock()
	defer dbLock.Unlock()

	if r.Method == "PUT" {
		var h HallOfFameEntry
		if err := json.NewDecoder(r.Body).Decode(&h); err != nil {
			sendError(w, 400, "Invalid input")
			return
		}
		if _, exists := appDB.HallOfFame[id]; !exists {
			sendError(w, 404, "Not found")
			return
		}
		h.ID = id
		appDB.HallOfFame[id] = h
		saveDB()
		sendJSON(w, 200, h)
	} else if r.Method == "DELETE" {
		delete(appDB.HallOfFame, id)
		saveDB()
		sendJSON(w, 200, map[string]string{"message": "Deleted"})
	}
}
