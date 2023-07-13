const db = require('./../models/sql')();
const start =require('./start.js')

async function initIndexer(sesId,fcount,forced=false){

let chk =await db.tableExists('crawler',`links${sesId}`)
  if (chk){


let chk =await db.tableExists('indexer',`index${sesId}`)
 
  if (chk){
    
if (forced){
  code=`drop table index${sesId}`
  db.sqlret(code,function(result){
    createTable(sesId,fcount)
  })
}
else{console.log("indexer data already exist you may want to resume")}
  }
else{
  createTable(sesId,fcount)
}


  }
  else{
    console.log("wrong session id")
  }


}
async function resumeIndexer(sesId,fcount){

  let chk =await db.tableExists('indexer',`index${sesId}`)
 
  if (chk){
     
start.startIndexer(sesId,fcount);
    }
    else{
      console.log("Invalid Session ID")
    }
  

}
///////////////////////////////////////////////////////////////////////////////










//////////////////////////////////////////////////////////////////////////////


function createTable(sesId,fcount){
  code=`
  CREATE TABLE IF NOT EXISTS indexer.index${sesId} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    term VARCHAR(100) NOT NULL,
    url VARCHAR(100) NOT NULL,
    path VARCHAR(200) NOT NULL,
    weight INT,
    w_freq INT,
    title_f INT,
    head INT,
    meta INT,
    UNIQUE KEY unique_url_term (url, term)
  );`

db.sqlret(code,function(result){
  start.startIndexer(sesId,fcount)
}
)
}

module.exports = {
  initIndexer,
  resumeIndexer,
};