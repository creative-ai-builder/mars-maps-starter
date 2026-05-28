#!/usr/bin/env python3
"""
verify_setup.py — Run this to confirm your Mars Maps environment is ready.
Usage: python verify_setup.py
"""

import sys
import os
import shutil
import importlib.util

CYAN  = "\033[96m"
GREEN = "\033[92m"
RED   = "\033[91m"
GOLD  = "\033[93m"
BOLD  = "\033[1m"
RESET = "\033[0m"

def check(label, result, fix=None):
    icon = f"{GREEN}✅{RESET}" if result else f"{RED}❌{RESET}"
    print(f"  {icon}  {label}")
    if not result and fix:
        print(f"      {GOLD}→ {fix}{RESET}")
    return result

def has_module(name):
    return importlib.util.find_spec(name) is not None

print()
print(f"{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
print(f"{BOLD}{CYAN}  🔍 Mars Maps Environment Check{RESET}")
print(f"{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
print()

results = []

# Python version
results.append(check(
    f"Python {sys.version_info.major}.{sys.version_info.minor} installed",
    sys.version_info >= (3, 10),
    "Ask your instructor — Python should have been set up automatically"
))

# Required packages
results.append(check(
    "folium installed  (makes the map)",
    has_module("folium"),
    "Open the terminal and run:  pip install folium"
))

results.append(check(
    "requests installed  (fetches data from the web)",
    has_module("requests"),
    "Open the terminal and run:  pip install requests"
))

results.append(check(
    "pillow installed  (handles images)",
    has_module("PIL"),
    "Open the terminal and run:  pip install pillow"
))

# Git
results.append(check(
    "git installed  (saves your work to GitHub)",
    shutil.which("git") is not None,
    "Ask your instructor"
))

# Running inside a Codespace
in_codespace = os.environ.get("CODESPACES") == "true"
results.append(check(
    "Running inside a GitHub Codespace",
    in_codespace,
    "This script is designed to run inside a Codespace — ask your instructor"
))

# Summary
all_good = all(results)
print()
print(f"{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
if all_good:
    print(f"  {GREEN}{BOLD}🚀 Everything looks great!{RESET}")
    print(f"  {GREEN}You are ready to build Mars Maps.{RESET}")
else:
    print(f"  {RED}{BOLD}⚠️  Something needs attention.{RESET}")
    print(f"  {GOLD}Tell your instructor which ❌ you see above.{RESET}")
print(f"{BOLD}{CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━{RESET}")
print()

# Manual checks reminder
print(f"{GOLD}  Manual checks (ask your instructor to confirm):{RESET}")
print(f"  ☐  Roo Code icon visible in the left sidebar")
print(f"  ☐  Roo Code responds when you type in it (try Ask mode → 'say hi')")
print(f"  ☐  Editor theme is glowing neon (SynthWave '84)")
print(f"  ☐  Font size looks large and easy to read")
print()
