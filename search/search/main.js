const db = require('./../models/sql')();

async function sesSearch(sesId, word, lmt = 5, chk = 0) {
  let code;
  let params;

  if (chk === 'strict') {
    code = `SELECT term, url FROM indexer.index${sesId} WHERE term = ? order by title_f desc,meta desc,head desc,w_freq desc LIMIT ${lmt} ;`;
    params = [word];
  } else {
    code = `SELECT term, url FROM indexer.index${sesId} WHERE term LIKE ? order by title_f desc,meta desc,head desc,w_freq desc LIMIT  ${lmt};`;
    params = [`%${word}%`];
  }

  db.sqlexe(code, params, function(result) {
    for(let i=0;i<result.length;i++){
    console.log(`${result[i].term} : ${result[i].url}`);}
    if(result.length){
    console.log(`${result.length} results found`)}
    else{
      console.log(`NO results found`)
    }

  });
}



module.exports = {
//  globalSearch,
  sesSearch,
};