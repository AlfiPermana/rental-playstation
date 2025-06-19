const db = require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  static async create(username, email, password, role = "user") {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );
    return result;
  }

  static async findByUsername(username) {
    const [rows] = await db.execute("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(id, username, email) {
    const [result] = await db.execute(
      "UPDATE users SET username = ?, email = ? WHERE id = ?",
      [username, email, id]
    );
    return result;
  }

  static async updatePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await db.execute(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashedPassword, id]
    );
    return result;
  }
  // Tambahkan metode lain sesuai kebutuhan (update, delete, getAll, dll.)
}

module.exports = User;
