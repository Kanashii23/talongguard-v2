const initSqlJs = require('sql.js');
const fs = require('fs');
async function run() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync('talonggaurd.db'));
  const rows = db.exec("SELECT scanned_at, healthy, insect, leafspot, mosaic, wilt FROM scan_records WHERE scanned_at LIKE '09/03%' LIMIT 5");
  console.log('March 9 sample:', JSON.stringify(rows[0]?.values, null, 2));
  const total = db.exec("SELECT SUM(healthy), SUM(insect) FROM scan_records WHERE scanned_at LIKE '09/03%'");
  console.log('March 9 totals:', JSON.stringify(total[0]?.values));
  db.close();
}
run();
