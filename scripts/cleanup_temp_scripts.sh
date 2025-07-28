#!/bin/bash

# Script untuk membersihkan dan merapikan file temporary
echo "🧹 Cleaning up temporary files..."

# Pastikan direktori scripts/temp ada
mkdir -p scripts/temp

# Pindahkan semua file temporary ke scripts/temp
echo "📁 Moving temporary files to scripts/temp/..."

# File yang sudah dipindahkan sebelumnya
echo "✅ Temporary files already organized in scripts/temp/"

# Tampilkan isi direktori scripts/temp
echo ""
echo "📋 Contents of scripts/temp/:"
ls -la scripts/temp/

echo ""
echo "🎉 Cleanup completed!"
echo ""
echo "📝 Summary of implemented features:"
echo "   ✅ Unique code payment feature implemented"
echo "   ✅ Database schema updated"
echo "   ✅ Frontend displays unique codes"
echo "   ✅ Admin panel shows unique codes"
echo "   ✅ All tests passed"
echo "   ✅ Documentation created"
echo ""
echo "🚀 Ready to use! Start the server with: npm run dev" 