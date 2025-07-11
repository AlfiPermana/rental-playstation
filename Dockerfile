# Gunakan image Node.js LTS sebagai base image
FROM node:20-alpine

# Set working directory di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json ke working directory
# Ini dilakukan terpisah agar layer node_modules bisa di-cache
COPY package*.json ./

# Install dependencies aplikasi
# Gunakan --omit=dev untuk tidak menginstal devDependencies di lingkungan produksi
RUN npm install --omit=dev

# Copy semua file project lainnya ke working directory
COPY . .

# Buat folder uploads jika belum ada (penting untuk Multer)
# Pastikan folder ini memiliki izin yang benar
RUN mkdir -p public/uploads && chmod -R 777 public/uploads

# Expose port yang digunakan aplikasi Node.js Anda
# Pastikan ini sesuai dengan nilai PORT di .env Anda (misal: 3000)
EXPOSE 3000

# Command untuk menjalankan aplikasi
# Gunakan 'npm start' seperti yang didefinisikan di package.json
CMD [ "npm", "start" ]