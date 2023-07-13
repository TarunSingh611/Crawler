const axios = require('axios');
const fs = require('fs');
const path = require('path');
const savePage = require('./savePage');
const db = require('./../models/sql')();
const { URL } = require('url');
let domainTracker = {}

let prntDepth = -1;

function crawl(seed = "http://gcetjammu.org.in/", maxDepth = 3, ms = 1,lmt=5,maxreq=25,chk = false, sesId = Date.now()) {


  ms = ms * 60000;
 let domain= getDomainFromUrl(seed);
  const code = `CREATE TABLE IF NOT EXISTS links${sesId} (
    id INT AUTO_INCREMENT PRIMARY KEY,
    domain VARCHAR(100) NOT NULL,
    url VARCHAR(100) NOT NULL unique,
    path VARCHAR(200),
    file_read TINYINT(1),
    depth INT,
    maxDepth INT,
    visited TINYINT(1),
    indexed TINYINT(1)
  );`;
  

  let dbseed = seed;

  const date = new Date();
  const runFolderName = `${date.getTime()}_${seed.replace(/http|www|[:/?.=]/g, '')}`;
  const folderPath = path.join(__dirname, '..', 'extracted', runFolderName);

  const regex = /^(https?:\/\/[^/]+)/;
  seed = seed.match(regex)[1];

  const session = {
    seed: seed,
    path: folderPath,
    time: ms,
    limit:lmt,
    chk: chk,
    sesId:sesId,
    maxreq:maxreq
  };

  let savedDat = [];

  fs.readFile("data.json", "utf-8", function (err, data) {
    if (err) {
      console.error(err);
    } else {
      try {
        savedDat = JSON.parse(data);
        const sessionExists = savedDat.some(item => item.sesId === session.sesId);

        if (sessionExists) {
          console.log("A session with the same sesId already exists. Please change the session sesId.");
        } else {
          savedDat.push(session);

          fs.writeFile("data.json", JSON.stringify(savedDat), function (err) {
            if (err) {
              console.error(err);
            } else {
              db.sqlret(code, function (result) {
                db.sqlret(`TRUNCATE TABLE links${sesId}`, function (result) {
                  
                  db.entr(sesId, dbseed,domain, 0, maxDepth);
                  startCrawler(folderPath, ms,lmt, chk, sesId, seed,maxreq);
                });
              });

             
            }
          });
        }
      } catch (error) {
        console.error("Error parsing JSON data:", error);
      }
    }
  });
}

function resumeCrawl(sesId) {
  fs.readFile("data.json", "utf-8", function (err, data) {
    if (err) {
      console.error(err);
    } else {
      try {
        const jsonData = JSON.parse(data);
        const session = jsonData.find((item) => item.sesId == sesId);

        if (session) {
          console.log("Resuming crawling...");
          console.log("Path:", session.path);
          console.log("Time:", session.time);

          db.sqlret(`update links${sesId} set visited=0 where path is null;`,function(result){
            startCrawler(session.path, session.time, session.limit,session.chk, session.sesId, session.seed,session.maxreq);
          })

          
        } else {
          console.log(`No data found for sesId ${sesId}`);
          return;
        }
      } catch (error) {
        console.error("Error parsing or handling JSON data:", error);
      }
    }
  });
}
/////////////////////////////////////////////////////////////////////////////
function startCrawler(folderPath, ms, lmt , chk = false, sesId = 0, seed,maxreq) {

 

  console.log(`your Session sesId is ${sesId}`);

  console.log("crawling...");
  
   processLink()
  const crawlInterval = setInterval(processLink, 500);

  async function processLink() {

    const reqno = Object.values(domainTracker).reduce((acc, value) => acc + value, 0);
    console.log(`reqno : ${reqno}`)
    if(reqno>=maxreq){
      return;
    }

    
    const domainsToExclude = Object.keys(domainTracker).filter(domain => domainTracker[domain] > lmt-1);
    const domainsToExcludeList = domainsToExclude.map(domain => `'${domain}'`).join(',');
   
    console.log(`excluded : ${domainsToExcludeList}` )
    console.log(domainTracker)
    let code

    if (domainsToExcludeList) {
      code = `SELECT * FROM crawler.links${sesId} WHERE url IS NOT NULL AND visited = 0 AND domain NOT IN (${domainsToExcludeList}) ORDER BY depth ASC LIMIT 1;`;
      console.log(`excluded: ${domainsToExcludeList}`);
      // Execute the SQL query
    } else {
      code = `SELECT * FROM crawler.links${sesId} WHERE url IS NOT NULL AND visited = 0  ORDER BY depth ASC LIMIT 1;`;
      console.log('No domains to exclude');
      
    }
   
    let res= await getdata(code)
   


    if (!res || res.length === 0) {
      
      const code=`SELECT * FROM crawler.links${sesId} WHERE url IS NOT NULL AND visited = 0;`
       chkres= await getdata(code)
       if (!chkres || chkres.length === 0) {
       console.log("Crawling Completed")
        clearInterval(crawlInterval);

        if (chk) {
          const response = await axios.get(`http://127.0.0.1:8000/stop_session?sid=${sesId}`);
          if (response.status === 200) {
            console.log(response.data);
          } else {
            console.log("error-exit");
          }
        }
       
      }
      return;
    }

    updateDomainTracker(res.domain,ms);
    


    if (prntDepth < res.depth) {
      console.log(`Depth: ${res.depth}`);
      prntDepth = res.depth;

     const code=`SELECT count(url) as count FROM crawler.links${sesId} where depth=${res.depth};`
      let count= await getdata(code)
      console.log(`no.of links : ${count.count}`)
    }

    try {
      let url = res.url;
      if (chk) {
        url = `${url}?sid=${sesId}&depth=${res.depth}`;
      }
      console.log(url);
      const response = await axios.get(url, { responseType: 'stream' });
      if (response.status === 200) {
        console.log({ visited: res.url, depth: res.depth });
        const savePath = path.join(folderPath, `depth_${res.depth}`);
        savePage(response, savePath, res.depth, res.url, res.maxDepth, seed, sesId,res.id);
        await markread(res.id, sesId);
      } else {
        console.log({ notVisited: res.url });
        await  markread(res.id, sesId);
        await pathval(res.id, sesId)
      }
    } catch (err) {
      
      console.log("error-getting-axios");
      if (res) {
       await  markread(res.id, sesId);
       await pathval(res.id, sesId)
      }
    }
  }
//////////////////////////////////////////////////////////////////////////////
  async function markread(id, sesId) {
    const code = `UPDATE links${sesId} SET visited = 1 WHERE id = '${id}';`;
    await db.sqlwrite(code);
  }

  async function pathval(id,sesId){
    return new Promise((resolve, reject) => {
    const code = `UPDATE links${sesId} SET path = ? WHERE id = ?`;
    const params = ["invalid", id];

    db.sqlexe(code, params, function (result) {
      resolve();
    });
  })
  }

  async function getdata(code) {
    return new Promise((resolve, reject) => {
      db.sqlret(code, function (result) {
        resolve(result[0]);
      });
    });
  }

  
  
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

function updateDomainTracker(domain,ms) {
  if (domain in domainTracker) {
    domainTracker[domain]++;
  } else {
    domainTracker[domain] = 1;
  }

  setTimeout(() => {
    decrementDomainCount(domain);
  }, ms);
}

function decrementDomainCount(domain) {
  if (domain in domainTracker) {
    domainTracker[domain]--;
    if (domainTracker[domain] <= 0) {
      delete domainTracker[domain];
    }
  }
}

module.exports = {
  crawl,
  resumeCrawl,
};
