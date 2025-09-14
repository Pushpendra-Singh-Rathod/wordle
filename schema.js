const mysql = require("mysql2");
const fs = require("fs");
require("dotenv").config();

function createConnection() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_DATABASE || "test",
    port: process.env.DB_PORT || 4000,
    ssl: { rejectUnauthorized: true },
  });

  connection.connect((err) => {
    if (err) {
      console.error("❌ MySQL connection failed:", err.message);
    } else {
      console.log("✅ DB Connection successful!");
    }
  });

  return connection;
}

function addUser(name, email, password, callback) {
  const db = createConnection();
  const sql = `INSERT INTO Users (name, email, password) VALUES (?, ?, ?)`;

  db.query(sql, [name, email, password || null], (err, result) => {
    if (err) {
      console.error("❌ Error inserting user:", err.message);
      return callback(err, null);
    }
    console.log("✅ User inserted with ID:", result.insertId);
    callback(null, result.insertId);
    db.end();
  });
}

function createUserWithOauth({
  name,
  email,
  password,
  provider,
  providerAccountId,
}) {
  console.log()
  return new Promise((resolve, reject) => {
    const db = createConnection();

    db.beginTransaction((err) => {
      if (err) {
        db.end();
        return reject(err);
      }

      // 1️⃣ Insert into Users
      const userSql = `
        INSERT INTO Users (name, email, password)
        VALUES (?, ?, ?)
      `;
      db.query(userSql, [name, email, password || null], (err, userResult) => {
        if (err) {
          return db.rollback(() => {
            db.end();
            reject(err);
          });
        }

        const userId = userResult.insertId;

        // 2️⃣ Insert into OauthAccounts
        const oauthSql = `
          INSERT INTO OauthAccounts (user_id, provider, providerAccountId)
          VALUES (?, ?, ?)
        `;
        db.query(
          oauthSql,
          [userId, provider, providerAccountId],
          (err, oauthResult) => {
            if (err) {
              return db.rollback(() => {
                db.end();
                reject(err);
              });
            }

            // 3️⃣ Commit transaction
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  db.end();
                  reject(err);
                });
              }

              db.end();
              resolve({
                id: userId,
                name,
                email,
                provider,
                providerAccountId,
              });
            });
          }
        );
      });
    });
  });
}

function getUserWithOauthId(email, provider) {
  return new Promise((resolve, reject) => {
    const db = createConnection();

    const sql = `
      SELECT 
        u.user_id,
        u.name,
        u.email,
        oa.providerAccountId,
        oa.provider,
        oa.created_at
      FROM Users u
      LEFT JOIN OauthAccounts oa 
        ON oa.user_id = u.user_id AND oa.provider = ?
      WHERE u.email = ?
    `;

    db.query(sql, [provider, email], (err, results) => {
      db.end(); // close after query

      if (err) {
        console.error("❌ Error fetching user:", err.message);
        return reject(err);
      }

      resolve(results[0] || null); // return first user or null
    });
  });
}

function linkUserWithOauth(userId, provider, providerAccountId) {
  return new Promise((resolve, reject) => {
    const db = createConnection();

    const sql = `
      INSERT INTO OauthAccounts (user_id, provider, providerAccountId, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    db.query(sql, [userId, provider, providerAccountId], (err, result) => {
      if (err) {
        console.error("❌ Error linking user with OAuth:", err.message);
        reject(err);
        return;
      }

      resolve(result);
    });

    db.end();
  });
}

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const db = createConnection();

    const sql = `
      SELECT 
        user_id,
        name,
        email,
        password,   -- include password since it's needed for login check
        currtime
      FROM Users
      WHERE email = ?
      LIMIT 1
    `;

    db.query(sql, [email], (err, results) => {
      db.end(); // close after query

      if (err) {
        console.error("❌ Error fetching user by email:", err.message);
        return reject(err);
      }

      resolve(results[0] || null); // return first row or null
    });
  });
}


module.exports = {
  createConnection,
  addUser,
  createUserWithOauth,
  getUserWithOauthId,
  linkUserWithOauth,
  getUserByEmail,
};
