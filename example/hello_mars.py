#!/usr/bin/env python3
"""
hello_mars.py — Your very first Mars program!

Change the name on line 12 to yours, then run:
    python example/hello_mars.py
"""

# ── Change this to your name! ─────────────────────────────────────────────────
name = "Explorer"
# ─────────────────────────────────────────────────────────────────────────────

import datetime

sol_start = datetime.date(2021, 2, 18)   # Perseverance landing date
today     = datetime.date.today()
sol       = (today - sol_start).days     # approx Mars sols (close enough!)

print()
print(f"🚀  Hello from Mars, {name}!")
print()
print(f"📍  Location   : Jezero Crater  (18.4°N, 77.7°E)")
print(f"🌡️   Temperature : −73°C (average) / +20°C (summer afternoon)")
print(f"☀️   Sol number  : {sol:,}  (days since Perseverance landed)")
print(f"🌍  Distance   : {round(401_000_000 * 0.6, 0):,.0f} km from Earth today (roughly)")
print()
print(f"✅  Your Python program just ran successfully, {name}!")
print(f"    You are now officially a Mars programmer. 🔴")
print()
