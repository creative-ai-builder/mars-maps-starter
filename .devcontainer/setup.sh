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

# Pre-configure Roo Code so students don't have to enter API key manually
echo "🤖 Pre-configuring Roo Code..."
MACHINE_SETTINGS="$HOME/.vscode-remote/data/Machine/settings.json"
mkdir -p "$(dirname "$MACHINE_SETTINGS")"
cat > "$MACHINE_SETTINGS" << 'EOF'
{
  "zoo-code.apiProvider": "anthropic",
  "zoo-code.apiModelId": "claude-sonnet-4-6",
  "zoo-code.apiKey": "class2025",
  "zoo-code.anthropicBaseUrl": "https://mars-proxy.creative-ai-builder.workers.dev",
  "zoo-code.apiKey": "class2025"
}
EOF
echo "   ✅ Done"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Environment ready!"
echo ""
echo "  Next steps:"
echo "  1. Run:  python verify_setup.py"
echo "  2. Click the 🦁 Zoo Code icon in the left sidebar"
echo "  3. Click the gear icon → Import Settings → select zoo-code-settings.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
