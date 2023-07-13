const mysql = require('mysql2');


module.exports = function () {
  const con = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'abc@123',
    database: 'indexer',
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
  
   
    con.query(code, function (err, result) {
      if (err) {throw err}
      else{
        
        callback(result);
      }
      
    });
  
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
  
  function tableExists(schema, table) {
    return new Promise((resolve) => {
      const code = `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = '${schema}'
          AND table_name = '${table}'
        ) AS table_exists;
      `;
      con.query(code, function (err, result) {
        if (err) {throw err}   
        else{resolve(!!result[0].table_exists);} 
      });

    });
  }
  
  




  // Exported object with the table management functions
  return {
    sqlwrite,
    sqlret,
    tableExists,
    sqlexe
  };

};
