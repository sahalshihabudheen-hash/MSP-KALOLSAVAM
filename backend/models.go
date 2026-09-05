package main

type KalolsavamEvent struct {
	ID        string `json:"id"`
	Category  string `json:"category"`
	ItemName  string `json:"itemName"`
	ItemCode  string `json:"itemCode"`
}

type GroupMember struct {
	AdmissionNumber string `json:"admissionNumber"`
	FullName        string `json:"fullName"`
	ClassGrade      string `json:"classGrade"`
	Division        string `json:"division"`
}

type RegistrationEntry struct {
	ID               string        `json:"id"`
	AdmissionNumber  string        `json:"admissionNumber,omitempty"`
	FullName         string        `json:"fullName"`
	ClassGrade       string        `json:"classGrade"`
	Division         string        `json:"division"`
	Category         string        `json:"category"`
	ItemNames        []string      `json:"itemNames"`
	ItemCodes        []string      `json:"itemCodes"`
	Date             string        `json:"date"`
	RegistrationType string        `json:"registrationType,omitempty"`
	GroupMembers     []GroupMember `json:"groupMembers,omitempty"`
	GroupName        string        `json:"groupName,omitempty"`
}

type SampoornaStudent struct {
	AdmissionNumber string `json:"admissionNumber"`
	FullName        string `json:"fullName"`
	ClassGrade      string `json:"classGrade"`
	Division        string `json:"division"`
}

type SystemSettings struct {
	RegistrationOpen bool   `json:"registrationOpen"`
	StartDate        string `json:"startDate"`
	EndDate          string `json:"endDate"`
}

type GalleryImage struct {
	ID      string `json:"id"`
	URL     string `json:"url"`
	Caption string `json:"caption,omitempty"`
}

type GalleryAlbum struct {
	ID    string         `json:"id"`
	Title string         `json:"title"`
	Images []GalleryImage `json:"images"`
}

type HallOfFameEntry struct {
	ID            string `json:"id"`
	StudentName   string `json:"studentName"`
	ItemWon       string `json:"itemWon"`
	Year          string `json:"year"`
	ImageURL      string `json:"imageUrl"`
	AIDescription string `json:"aiDescription,omitempty"`
}

type Database struct {
	Events        map[string]KalolsavamEvent   `json:"events"`
	Registrations map[string]RegistrationEntry `json:"registrations"`
	Sampoorna     []SampoornaStudent           `json:"sampoorna"`
	Settings      SystemSettings               `json:"settings"`
	Gallery       map[string]GalleryAlbum      `json:"gallery"`
	HallOfFame    map[string]HallOfFameEntry   `json:"hallOfFame"`
}
