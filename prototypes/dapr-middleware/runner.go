package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"time"
)

func main() {
	// Start middleware
	fmt.Println("Starting middleware on :8080...")
	middlewareCmd := exec.Command("./middleware")
	middlewareCmd.Stdout = os.Stdout
	middlewareCmd.Stderr = os.Stderr
	middlewareCmd.Start()
	defer middlewareCmd.Process.Kill()

	time.Sleep(1 * time.Second)

	// Start app
	fmt.Println("Starting app on :8081...")
	appCmd := exec.Command("./app")
	appCmd.Stdout = os.Stdout
	appCmd.Stderr = os.Stderr
	appCmd.Start()
	defer appCmd.Process.Kill()

	time.Sleep(2 * time.Second)

	// Run tests
	fmt.Println("\n=== DAPR Middleware Transformation Test ===\n")
	fmt.Println("Running test suite...")

	testCmd := exec.Command("./test")
	testCmd.Stdout = os.Stdout
	testCmd.Stderr = os.Stderr

	if err := testCmd.Run(); err != nil {
		log.Printf("Test failed: %v", err)
	}

	// Keep processes alive briefly to allow final logs
	time.Sleep(500 * time.Millisecond)
}
