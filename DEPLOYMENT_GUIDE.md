# Panduan Deployment - Booking Tanpa Login

## Persiapan Deployment

### 1. **Backup Database**
```bash
# Backup database sebelum melakukan perubahan
mysqldump -u username -p database_name > backup_before_changes.sql
```

### 2. **Update Database Schema**
```bash
# Jalankan script SQL untuk menambah kolom baru
mysql -u username -p database_name < database_update.sql
```

### 3. **Verifikasi Database Changes**
```sql
-- Cek struktur tabel bookings
DESCRIBE bookings;

-- Cek index yang baru dibuat
SHOW INDEX FROM bookings;
```

## Deployment Steps

### Step 1: Update Code
1. **Backup code lama**
   ```bash
   cp -r rental-playstation rental-playstation-backup
   ```

2. **Update files yang sudah dimodifikasi**
   - `server/models/Booking.js`
   - `server/controllers/guestController.js` (new)
   - `server/routes/guestRoutes.js` (new)
   - `server/server.js`
   - `public/booking.html` (new)
   - `public/tracking.html` (new)
   - `public/js/booking.js` (new)
   - `public/js/tracking.js` (new)
   - `public/css/booking.css` (new)
   - `public/css/tracking.css` (new)
   - `public/index.html` (updated)

### Step 2: Install Dependencies
```bash
cd rental-playstation
npm install
```

### Step 3: Environment Configuration
```bash
# Buat atau update file .env
cat > .env << EOF
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
APP_URL=http://your-domain.com
PORT=3000
EOF
```

### Step 4: Test Local
```bash
# Test aplikasi di local
npm run dev

# Test endpoints
curl http://localhost:3000/api/guest/playstations
curl http://localhost:3000/booking
curl http://localhost:3000/tracking
```

### Step 5: Production Deployment

#### Option A: Direct Server Deployment
```bash
# Upload files ke server
scp -r rental-playstation user@your-server:/path/to/app/

# SSH ke server
ssh user@your-server

# Install dependencies
cd /path/to/app
npm install --production

# Restart aplikasi
pm2 restart rental-playstation
# atau
systemctl restart rental-playstation
```

#### Option B: Docker Deployment
```bash
# Build Docker image
docker build -t rental-playstation:latest .

# Run container
docker run -d \
  --name rental-playstation \
  -p 3000:3000 \
  --env-file .env \
  rental-playstation:latest
```

#### Option C: Docker Compose
```bash
# Update docker-compose.yml jika diperlukan
docker-compose up -d
```

## Testing Checklist

### 1. **Database Testing**
- [ ] Kolom baru berhasil ditambahkan
- [ ] Index berhasil dibuat
- [ ] Query guest booking berfungsi

### 2. **API Testing**
```bash
# Test guest endpoints
curl http://your-domain.com/api/guest/playstations
curl "http://your-domain.com/api/guest/available-slots?playstationId=1&date=2024-01-15"
curl -X POST http://your-domain.com/api/guest/book \
  -H "Content-Type: application/json" \
  -d '{"playstationId":1,"bookingDate":"2024-01-15","startTime":"10:00","durationHours":2,"customerName":"Test User","customerEmail":"test@example.com","customerPhone":"08123456789"}'
```

### 3. **Frontend Testing**
- [ ] Halaman `/booking` dapat diakses
- [ ] Halaman `/tracking` dapat diakses
- [ ] Form booking berfungsi dengan baik
- [ ] Validasi input berfungsi
- [ ] Tracking booking berfungsi

### 4. **Integration Testing**
- [ ] Guest booking dapat dibuat
- [ ] Booking dapat ditrack
- [ ] Admin dapat melihat guest booking
- [ ] Payment flow tetap berfungsi

## Monitoring & Maintenance

### 1. **Log Monitoring**
```bash
# Monitor application logs
tail -f /var/log/rental-playstation/app.log

# Monitor error logs
grep "ERROR" /var/log/rental-playstation/app.log
```

### 2. **Database Monitoring**
```sql
-- Monitor guest bookings
SELECT COUNT(*) as total_guest_bookings FROM bookings WHERE user_id IS NULL;

-- Monitor booking success rate
SELECT 
    status,
    COUNT(*) as count
FROM bookings 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY status;
```

### 3. **Performance Monitoring**
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://your-domain.com/api/guest/playstations"

# Monitor server resources
htop
df -h
free -h
```

## Rollback Plan

### Jika terjadi masalah, rollback dengan langkah:

1. **Rollback Database** (jika diperlukan)
   ```sql
   -- Hapus kolom yang ditambahkan (HATI-HATI!)
   ALTER TABLE bookings DROP COLUMN customer_name;
   ALTER TABLE bookings DROP COLUMN customer_email;
   ALTER TABLE bookings DROP COLUMN customer_phone;
   ```

2. **Rollback Code**
   ```bash
   # Restore dari backup
   rm -rf rental-playstation
   cp -r rental-playstation-backup rental-playstation
   cd rental-playstation
   npm install
   ```

3. **Restart Application**
   ```bash
   pm2 restart rental-playstation
   # atau
   systemctl restart rental-playstation
   ```

## Security Considerations

### 1. **Rate Limiting**
```javascript
// Implement rate limiting untuk guest endpoints
const rateLimit = require('express-rate-limit');

const guestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/guest', guestLimiter);
```

### 2. **Input Validation**
- Email validation sudah diimplementasi
- Phone number validation sudah diimplementasi
- Consider adding CAPTCHA untuk mencegah spam

### 3. **Data Protection**
- Guest data disimpan dengan aman
- Implement data retention policy
- Regular backup untuk guest booking data

## Troubleshooting

### Common Issues:

1. **Database Connection Error**
   ```bash
   # Check database connection
   mysql -u username -p -h hostname database_name
   ```

2. **API Endpoints Not Working**
   ```bash
   # Check server logs
   tail -f /var/log/rental-playstation/app.log
   
   # Check if server is running
   ps aux | grep node
   ```

3. **Frontend Not Loading**
   ```bash
   # Check static files
   ls -la public/
   
   # Check permissions
   chmod -R 755 public/
   ```

4. **Booking Creation Failed**
   ```bash
   # Check database schema
   DESCRIBE bookings;
   
   # Check for errors in logs
   grep "Error" /var/log/rental-playstation/app.log
   ```

## Support & Contact

Untuk bantuan teknis atau masalah deployment:
- Email: support@your-domain.com
- Phone: +62-xxx-xxx-xxxx
- Documentation: https://your-domain.com/docs

## Post-Deployment Checklist

- [ ] Database schema updated
- [ ] All new files deployed
- [ ] Environment variables configured
- [ ] Application restarted
- [ ] All endpoints tested
- [ ] Frontend pages accessible
- [ ] Guest booking flow tested
- [ ] Tracking functionality tested
- [ ] Admin dashboard updated
- [ ] Monitoring configured
- [ ] Backup strategy updated
- [ ] Documentation updated 