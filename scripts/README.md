# MIRAGE — Scripts

All launch scripts are organised by operating system. Run everything from the **MIRAGE repo root**, or call the scripts directly — they resolve paths automatically.

---

## 📁 Structure

```
scripts/
├── linux/                  # Bash scripts — Debian / Ubuntu / macOS
│   ├── start-mirage.sh     # Start all 5 services
│   ├── kill-mirage.sh      # Kill all running services
│   ├── demo-exploit.sh     # Run the OTP exploit (attacker terminal)
│   ├── auto-demo.sh        # Playwright-based automated demo
│   └── demo-script.sh      # Full colourised attack walkthrough
│
└── win/                    # Windows scripts
    ├── start-mirage.ps1    # Start all 5 services (PowerShell)
    ├── kill-mirage.bat     # Kill all running services
    ├── demo-exploit.bat    # Run the OTP exploit (attacker terminal)
    └── auto-demo.bat       # Playwright-based automated demo
```

---

## 🐧 Linux / Debian / macOS

> **Prerequisites:** `python3`, `pip`, `node`, `npm` must be on your PATH.

```bash
# 1 — Start everything (opens 5 services in one terminal)
bash scripts/linux/start-mirage.sh

# 2 — During the demo: run the OTP exploit in a second terminal
bash scripts/linux/demo-exploit.sh

# 3 — Show the full colourised attack walkthrough
bash scripts/linux/demo-script.sh

# 4 — Playwright automated demo (requires services already running)
bash scripts/linux/auto-demo.sh

# 5 — Kill all services
bash scripts/linux/kill-mirage.sh
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Real Bank (demo account: `40021234567`) |
| http://localhost:4000 | Honeypot (any credentials accepted) |
| http://localhost:5000 | Admin Export Portal |
| http://localhost:8000/docs | Backend API Swagger |
| http://localhost:8080 | SOC Analyst Dashboard |

---

## 🪟 Windows

> **Prerequisites:** Python 3.11+, Node 18+, `npm` on PATH.  
> PowerShell execution policy must allow scripts: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

```powershell
# 1 — Start everything (run in PowerShell from repo root)
powershell -ExecutionPolicy Bypass -File scripts\win\start-mirage.ps1

# 2 — During the demo: OTP exploit in a second terminal
scripts\win\demo-exploit.bat

# 3 — Playwright automated demo
scripts\win\auto-demo.bat

# 4 — Kill all services
scripts\win\kill-mirage.bat
```

---

## ⚠️ Notes

- On first run, `start-mirage.sh` / `start-mirage.ps1` will automatically create the Python venv and install all dependencies — this takes ~60 s.
- Subsequent runs skip dependency installation if `backend/.venv` and `*/node_modules` already exist.
- Press **Ctrl+C** in the startup terminal to gracefully stop all services.
