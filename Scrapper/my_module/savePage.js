const fs = require('fs');
const path = require('path');
const db =require("./../models/sql")() ;
const ext =require("./extracter")


async function savePage(response, folderPath, depth, url,maxDepth,seed,sesId,id) {
 
  await createDirectory(folderPath);
  const filePath = path.join(folderPath, `${url.replace(/http|www|[:/]/g, '')}_${id}.html`);
  const fileStream = fs.createWriteStream(filePath);

  return new Promise((resolve, reject) => {
    response.data.pipe(fileStream);

    fileStream.on('finish', async () => {
      console.log(`Saved page: ${url}`);

      try {
        const code = `UPDATE links${sesId} SET path = ? WHERE id = ?`;
        const params = [filePath, id];

        db.sqlexe(code, params, function (result) {
          if(depth<maxDepth){
          ext.extract(seed,sesId);}
        });

        console.log('Data saved in the database:');
        
        resolve()
      } catch (error) {
        console.error('Error saving data in the database:', error);
       
        resolve();
      }
    });

    fileStream.on('error', (error) => {
      console.error(`Error saving page: ${url}`, error);
      const code = `UPDATE links${sesId} SET path = ? WHERE id = ?`;
        const params = ["invalid", id];

        db.sqlexe(code, params, function (result) {
          resolve();
        });
          
    });
  });
}



async function createDirectory(folderPath) {
  try {
    await fs.promises.access(folderPath);
  } catch (error) {
    await fs.promises.mkdir(folderPath, { recursive: true });
  }
}

module.exports = savePage;
