#!/bin/bash
# Runs ONCE when the Codespace is first created.
# Never uses set -e — a failure here should not crash the whole Codespace.

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 Setting up your Mars Maps environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install Python packages — || true means a failure here won't crash setup
echo "📦 Installing Python packages..."
pip install --quiet folium requests pillow || {
  echo "   ⚠️  pip install failed — run 'pip install folium requests pillow' manually later"
}
echo "   ✅ Done"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Environment ready!"
echo ""
echo "  Next steps:"
echo "  1. Run:  python verify_setup.py"
echo "  2. Click the 🦘 Roo Code icon in the left sidebar"
echo "  3. Enter API key:  class2025"
echo "  4. Enter API Base URL:"
echo "     https://mars-proxy.creative-ai-builder.workers.dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
