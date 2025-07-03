const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // Import jwt untuk verifikasi token
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { verifyToken, checkRole } = require('./middleware/authMiddleware'); // Import middleware
// const webhookRoutes = require('./routes/webhookRoutes'); 

const multer = require('multer'); // <<< TAMBAHKAN BARIS INI


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing body request
app.use(express.json()); // Untuk JSON body
app.use(express.urlencoded({ extended: true })); // Untuk form URL-encoded body

// Tentukan tempat penyimpanan file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Folder tempat file akan disimpan. Pastikan folder ini ADA di public/
        // Anda perlu membuat folder public/uploads secara MANUAL jika belum ada
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        // Atur nama file yang unik untuk menghindari tabrakan
        // Contoh: bukti_booking_[bookingId]_[timestamp].[ekstensi]
        const ext = path.extname(file.originalname); // Ambil ekstensi asli
        // Kita akan menggunakan bookingId yang didapat dari body request (atau params)
        // Untuk saat ini, kita bisa pakai random ID atau userId
        cb(null, 'bukti_' + Date.now() + '_' + Math.round(Math.random() * 1E9) + ext);
    }
});
const upload = multer({ storage: storage }); // <<< Middleware Multer siap

// Serve static files dari direktori 'public' (dua kali, salah satunya dihapus)
// app.use(express.static(path.join(__dirname, '../public'))); // BARIS INI DUPLIKAT, HAPUS SATU

// Sajikan folder 'public' secara keseluruhan
app.use(express.static(path.join(__dirname, '../public')));

// Sajikan juga folder 'uploads' agar bukti bisa diakses
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// Middleware untuk menentukan apakah perangkat mobile atau desktop
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'];
    const isMobile = Boolean(userAgent && /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|rim)|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(d|on)|ap(ad|eg|io)|appleinc|aqu(a|u)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|k3|l0)|br(e|v)w|bumb|by(ie|lo)|c55\/|c66\/|cldc|cmd\-|co(mp|in|on)|dbwa|dc\-s|delta|do(c|op)|el(ad|ie)|ezio|fgoto|fly(agi|well)|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp(i|ip)|hs\-c|ht(c(|oo|sp)d|tel)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\/|\-)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(gr|lk|ng)|mbcr|mc(ad|un)|me(wa|on|\-s)|mi(at|fl|gn)|mo(bi|wt)|mz\-j|na(nx|nd)|ne(t|rn)|nokia|nu(cl|in)|nv(at|tullen)|ojer|ol(ar|ox)|op(ti|wv)|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|od)|rpv |rwap|sa(ge|mark|bl)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|ad|et|fi|lt|va)|si(gh|n|sm)|sk\-0|sl(av|em)|smar|sq(12|70)|sr(01|c\-|e5|sc|ty)|t7(ae|op)|tdg\-|tel(i|m)|tim\-|tkwa|to(sys|wo)|treo|ts70|ttg1|u\.s\.o|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| ).+von|we(c|fi)|webc|whit|wi(g |nw)|wmlb|wonu|x700|yas\- |your|zeto|zte\-/i.test(userAgent.substr(0,4)));
    req.isMobile = isMobile;
    next();
});

// Root route untuk serve landing page sesuai device
app.get('/', (req, res) => {
    if (req.isMobile) {
        return res.sendFile(path.join(__dirname, '../public/index-mobile.html'));
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Endpoint untuk login/register
app.get('/login', (req, res) => {
    if (req.isMobile) {
        return res.sendFile(path.join(__dirname, '../public/login.html'));
    }
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/register', (req, res) => {
    if (req.isMobile) {
        return res.sendFile(path.join(__dirname, '../public/register.html'));
    }
    res.sendFile(path.join(__dirname, '../public/register.html'));
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', verifyToken, checkRole('user'), userRoutes); // Lindungi rute user
app.use('/api/admin', verifyToken, checkRole('admin'), adminRoutes); // Lindungi rute admin
// app.use('/api/midtrans-webhook', webhookRoutes); 


// Catch-all untuk halaman yang tidak ditemukan (404)
app.use((req, res) => {
    res.status(404).send('404 Not Found'); // Atau arahkan ke halaman 404 khusus
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});