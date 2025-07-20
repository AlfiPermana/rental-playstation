const db = require('../config/db');

class Playstation {
    static async getAll() {
        const [rows] = await db.execute('SELECT * FROM playstations');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.execute('SELECT * FROM playstations WHERE id = ?', [id]);
        return rows[0];
    }

    // <<< PERBAIKAN DI SINI: static async create >>>
    static async create(name, type, description, pricePerHour) { // Menambahkan pricePerHour sebagai parameter
        const [result] = await db.execute(
            'INSERT INTO playstations (name, type, description, price_per_hour) VALUES (?, ?, ?, ?)', // Menambahkan price_per_hour di INSERT
            [name, type, description, pricePerHour]
        );
        return result;
    }
    // <<< AKHIR PERBAIKAN >>>

    // <<< PERBAIKAN DI SINI: static async update >>>
    static async update(id, name, type, status, description, pricePerHour) { // Menambahkan pricePerHour sebagai parameter
        const [result] = await db.execute(
            'UPDATE playstations SET name = ?, type = ?, status = ?, description = ?, price_per_hour = ? WHERE id = ?', // Menambahkan price_per_hour di UPDATE
            [name, type, status, description, pricePerHour, id]
        );
        return result;
    }
    // <<< AKHIR PERBAIKAN >>>

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM playstations WHERE id = ?', [id]);
        return result;
    }
    
    static async getAvailablePlaystations() {
        const [rows] = await db.execute("SELECT * FROM playstations WHERE status = 'available'");
        return rows;
    }
}

module.exports = Playstation;