const mysql = require('mysql2');


module.exports = function () {
  const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'abc@123',
    database: 'crawler',
    port: 3306,
  });

  con.connect(function (err) {
    if (err) throw err;
    console.log('Connected!');
  });

  // Function to create a new table
  async function sqlwrite(code)  {
    const sql = code;

    con.query(sql, function (err, result) {
      if (err) {throw err}    
    });
  }

  function sqlret(code,callback) {
    const sql = code;
    con.query(sql, function (err, result) {
      if (err) {throw err}
      else{
        callback(result);
      }
      
    });
  
  }

function entr(sesId,url,domain,depth,maxDepth) {
  const sql = `INSERT IGNORE INTO links${sesId} 
  (domain, url, path, file_read, depth, maxDepth, visited,indexed) 
  VALUES ('${domain}','${url}', NULL, 0, ${depth}, ${maxDepth},0,0)`;
    con.query(sql);
  
  }

  function sqlexe(code, params, callback) {
    con.query(code, params, function (err, result) {
      if (err) {
        throw err;
      } else {
        callback(result);
      }
    });
  }
  
  




  // Exported object with the table management functions
  return {
    sqlwrite,
    sqlret,
    entr,
    sqlexe
  };

};
