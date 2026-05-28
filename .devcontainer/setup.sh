#!/bin/bash
# Runs ONCE when the Codespace is first created.
# Sets up Python packages and prints a clear first-launch message.

set -e  # stop on any error

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Setting up your Mars Maps environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Python packages ──────────────────────────────────────────────────────────
echo "📦 Installing Python packages..."
pip install --quiet folium requests pillow
echo "   ✅ folium, requests, pillow installed"

# ── Welcome message with API key setup instructions ──────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Environment ready!"
echo ""
echo "  ONE more step — connect Roo Code to Claude:"
echo ""
echo "  1. Click the Roo Code icon in the left sidebar 🦘"
echo "  2. When it asks for an API key, enter:  class2025"
echo "  3. For API Base URL enter:"
echo "     https://mars-proxy.creative-ai-builder.workers.dev"
echo ""
echo "  Then run:  python verify_setup.py"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
