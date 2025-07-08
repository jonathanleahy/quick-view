package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"time"
)

type MenuItem struct {
	ID       string      `json:"id"`
	Title    string      `json:"title"`
	Type     string      `json:"type"` // "menu", "cards", "leaf"
	Icon     string      `json:"icon,omitempty"`
	URL      string      `json:"url,omitempty"`
	Hotkey   string      `json:"hotkey,omitempty"`
	Children []MenuItem  `json:"children,omitempty"`
}

type MenuData struct {
	Items []MenuItem `json:"items"`
}

func main() {
	// Redirect root to menu.html
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/menu.html", http.StatusFound)
			return
		}
		http.FileServer(http.Dir("static")).ServeHTTP(w, r)
	})

	// API endpoint for menu data
	http.HandleFunc("/api/menu", menuHandler)

	port := ":8080"
	url := fmt.Sprintf("http://localhost%s", port)
	
	fmt.Printf("Starting menu system on %s\n", url)
	
	// Auto-open browser after short delay
	go func() {
		time.Sleep(500 * time.Millisecond)
		openBrowser(url)
	}()
	
	log.Fatal(http.ListenAndServe(port, nil))
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default: // linux and others
		cmd = exec.Command("xdg-open", url)
	}
	
	if err := cmd.Start(); err != nil {
		fmt.Printf("Failed to open browser: %v\n", err)
		fmt.Printf("Please manually navigate to %s\n", url)
	}
}

func menuHandler(w http.ResponseWriter, r *http.Request) {
	// Read menu data from JSON file
	data, err := os.ReadFile("data/menu.json")
	if err != nil {
		http.Error(w, "Error reading menu data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

