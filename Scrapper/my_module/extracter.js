const db = require("./../models/sql")();
const fs = require('fs');
let res;

async function extract(seed,sesId) {
  setTimeout(function(){

  const code = `SELECT * FROM crawler.links${sesId} WHERE path IS NOT NULL AND path!="invalid" AND file_read= 0 AND depth<maxDepth ORDER BY depth ASC LIMIT 1;`;
  try {
    db.sqlret(code, function(result) {
      if (result.length > 0) {
        res = result[0];
        extractlinks(res,seed, sesId);
        const code= `UPDATE links${sesId} SET file_read = 1 WHERE url = '${res.url}';`
        db.sqlwrite(code);
        console.log(`links extracted from ${res.url}`)
        ///
        
      
      } else {
        return;
      }
    });
  } catch (error) {
    console.error("Error executing SQL query:", error);
  }


})}

function extractlinks(res,seed,sesId) {
let internalLink;
  const stream = fs.createReadStream(res.path, 'utf8');

  stream.on('data', (data) => {
  
    const regex = /<a[^>]+href="([^"]+)"[^>]*>/g;
    let match;

    while ((match = regex.exec(data)) !== null) {
      
      const link = match[1];
  
      
      if (link) {
        const fileExtensionsToExclude = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'];
        if (
          (link.startsWith('http') &&  !fileExtensionsToExclude.some(extension => link.endsWith(extension))) ||
           (link.startsWith('/'))||
          (link.endsWith('html') || link.endsWith('htm'))
        ) {
         
          if (link.startsWith('/')) {
           
             internalLink = seed + link;
          }else if(!link.startsWith('http')&&(link.endsWith('html') || link.endsWith('htm'))){
             internalLink = new URL(link, res.url).href;
          }else{
            internalLink=link;
          }
          const newDepth = res.depth + 1;
          if (newDepth <= res.maxDepth) {
            
            const domain=getDomainFromUrl(internalLink)
            db.entr(sesId,internalLink,domain ,newDepth,res.maxDepth)
          }
        }
      }
    }
  });

  stream.on('error', (err) => {
    console.error(err);
  });
}


function getDomainFromUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}



module.exports = {
  extract: extract
};
