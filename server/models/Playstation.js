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

    static async create(name, type, description) {
        const [result] = await db.execute(
            'INSERT INTO playstations (name, type, description) VALUES (?, ?, ?)',
            [name, type, description]
        );
        return result;
    }

    static async update(id, name, type, status, description) {
        const [result] = await db.execute(
            'UPDATE playstations SET name = ?, type = ?, status = ?, description = ? WHERE id = ?',
            [name, type, status, description, id]
        );
        return result;
    }

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