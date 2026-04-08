const sql = require("mssql");
const config = require("./config");

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config.sql)
      .connect()
      .then((pool) => pool)
      .catch((err) => {
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

module.exports = { sql, getPool };
