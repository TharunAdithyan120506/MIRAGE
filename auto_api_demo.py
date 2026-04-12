import sys
import os
import time
import subprocess
from playwright.sync_api import sync_playwright

if sys.platform == "win32":
    os.system("")  # Enable ANSI escape codes on Windows
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# ── ANSI Colors ──────────────────────────────────────────────────────────────
RED    = "\033[91m"
GREEN  = "\033[92m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RESET  = "\033[0m"

def print_step(title):
    print(f"\n{YELLOW}{BOLD}▶ {title}{RESET}")
    print(f"{DIM}──────────────────────────────────────────────────────{RESET}")

def print_sub(msg):
    print(f"  {CYAN}>>> {msg}{RESET}")

def print_good(msg):
    print(f"  {GREEN}✓ {msg}{RESET}")

def print_bad(msg):
    print(f"  {RED}✗ {msg}{RESET}")

def main():
    print(f"\n{RED}{BOLD}╔══════════════════════════════════════════════════════════════╗{RESET}")
    print(f"{RED}{BOLD}║{RESET}           {CYAN}{BOLD}MIRAGE — Automated Hacking Framework{RESET}                 {RED}{BOLD}║{RESET}")
    print(f"{RED}{BOLD}║{RESET}  {DIM}Auto-exploiting: Real Bank → Honeypot → Admin Portal{RESET}    {RED}{BOLD}║{RESET}")
    print(f"{RED}{BOLD}╚══════════════════════════════════════════════════════════════╝{RESET}\n")

    with sync_playwright() as p:
        # Launch browser (non-headless so the judges can see the magic!)
        browser = p.chromium.launch(headless=False, slow_mo=500)
        
        # Create a new context with a realistic hacking User-Agent
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 sqlmap/1.6.8.9#dev",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()

        # Listen to console messages to show the "leaked" debug info
        def handle_console(msg):
            text = msg.text
            if "[SEC]" in text:
                if "FAULT" in text or "ERROR" in text or "NOTICE" in text:
                    print(f"  {RED}[BROWSER CONSOLE] {text}{RESET}")
                else:
                    print(f"  {YELLOW}[BROWSER CONSOLE] {text}{RESET}")

        page.on("console", handle_console)

        # ── PHASE 1: REAL BANK ───────────────────────────────────────────────
        print_step("PHASE 1: Attacking Real Bank (port 3000)")
        print_sub("Navigating to target...")
        
        # Pause to explain the start
        page.wait_for_timeout(3000)
        
        try:
            page.goto("http://localhost:3000", timeout=10000)
        except Exception:
            print_bad("Cannot reach port 3000. Is the MIRAGE server running?")
            sys.exit(1)

        print_sub("Attempting SQL Injection login bypass...")
        
        for i in range(1, 4):
            print_sub(f"Attempt {i}: Admin Login SQLi payload")
            # Step 1: Credentials
            page.fill("input[type='text']", "admin' OR '1'='1")
            page.fill("input[type='password']", f"password123_try_{i}")
            page.click("button[type='submit']")
            
            # Walk the judges through the fails
            page.wait_for_timeout(2000)
            
            # Step 2: Verification (OTP)
            page.wait_for_selector("input[placeholder='Enter 6-digit OTP']")
            page.wait_for_timeout(1000) # pause before typing OTP
            page.fill("input[placeholder='Enter 6-digit OTP']", "123456")
            page.wait_for_timeout(500)
            page.click("button[type='submit']")
            
            # Wait for error and back to Step 1
            page.wait_for_timeout(3000)
            
            # The UI should show an error
            if i < 3:
                print_bad("Login failed. Trying another payload...")
                page.wait_for_timeout(2000) # Pause so they see the lockout/error string
            else:
                print_good("Multiple failures triggered! Checking console for leaks...")

        page.wait_for_timeout(4000)
        print_good("Hacker notices internal topology leaked in console output!")
        print_good("Target acquired: Debug Portal (4000) & Admin Export (5000)")
        
        # Pause before pivot
        page.wait_for_timeout(4000)

        # ── PHASE 2: HONEYPOT ────────────────────────────────────────────────
        print_step("PHASE 2: Pivoting to Honeypot (port 4000)")
        print_sub("Navigating to exposed debug portal...")
        page.goto("http://localhost:4000")
        
        print_sub("Trying basic admin credentials...")
        page.fill("input[type='text']", "admin")
        page.fill("input[type='password']", "admin123")
        page.click("button[type='submit']")
        
        # Step 2: Verification (OTP) on Honeypot
        page.wait_for_selector("input[placeholder='Enter 6-digit OTP']")
        # Since it's a honeypot, ANY OTP is accepted, but type one anyway
        page.fill("input[placeholder='Enter 6-digit OTP']", "000000")
        page.click("button[type='submit']")
        
        page.wait_for_load_state("networkidle")
        print_good("Bypass successful! Inside the banking portal.")
        
        print_sub("Harvesting data... (Navigating tabs)")
        try:
            page.click("text=Transfer", timeout=2000)
            page.wait_for_timeout(1500)
            page.click("text=Statement", timeout=2000)
            page.wait_for_timeout(1500)
        except:
            pass

        print_good("Data harvested from Honeypot.")

        # Extract session_id to pass it to the next service so it's all one session
        session_id = page.evaluate("sessionStorage.getItem('honey_session')") or ""

        # ── PHASE 3: NMAP SCAN ───────────────────────────────────────────────
        print_step("PHASE 3: Running internal scan from Honeypot shell...")
        print_sub("Executing: nmap 127.0.0.1 -p 5000")
        
        print(f"  {DIM}Starting Nmap 7.94 ( https://nmap.org ) at {time.strftime('%Y-%m-%d %H:%M')}{RESET}")
        print(f"  {DIM}Nmap scan report for localhost (127.0.0.1){RESET}")
        print(f"  {DIM}PORT     STATE SERVICE           VERSION{RESET}")
        print(f"  {DIM}5000/tcp open  http              {GREEN}{BOLD}Python/FastAPI (Admin Export Service){RESET}")
        print(f"  {DIM}Nmap done: 1 IP address (1 host up) scanned in 1.12 seconds{RESET}\n")

        print_good("Discovered Admin Export Service on port 5000!")
        
        # Pause to explain Nmap find
        page.wait_for_timeout(4000)


        # ── PHASE 4: ADMIN PORTAL ─────────────────────────────────────────────
        print_step("PHASE 4: Exploiting Admin Export Portal (port 5000)")
        print_sub("Navigating to internal data export service...")
        page.goto(f"http://localhost:5000?session_id={session_id}")
        
        page.wait_for_timeout(2000) # pause to show admin UI

        print_sub("Attempting to dump users database...")
        page.click("text=Export Users CSV")
        page.wait_for_timeout(2000)

        print_bad("Export requires OTP verification!")
        print_sub("Initializing MITM OTP Interception script...")
        
        # ── PHASE 5: MITM OTP SCRIPT ─────────────────────────────────────────
        print_step("PHASE 5: MITM OTP Interception")
        # Run the OTP exploit script inline so it shows in the same terminal
        subprocess.run([sys.executable, "backend/otp_exploit.py"])
        
        # ── PHASE 6: ENTER OTP ───────────────────────────────────────────────
        print_step("PHASE 6: Bypassing OTP Prompt")
        print_sub("Entering intercepted OTP: 847293")
        
        # Make the typing look realistic
        otp_field = page.locator("#otpInput")
        for digit in "847293":
            otp_field.type(digit, delay=150)
            
        page.wait_for_timeout(2000) # give judges time to read alert
        page.click("button:has-text('Verify & Export Data')")
        page.wait_for_timeout(2000)
        
        print_bad("OTP REJECTED — Account Locked.")
        page.wait_for_timeout(3000)
        print_good("The hacker was trapped. MIRAGE captured the full profile.")
        print(f"\n{CYAN}{BOLD}Demo Automation Complete! Close the browser to end the simulation.{RESET}\n")
        
        # Keep browser open until user closes it
        try:
            page.wait_for_timeout(99999999)
        except:
            pass
        
        browser.close()

if __name__ == "__main__":
    main()
