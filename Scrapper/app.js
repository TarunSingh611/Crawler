const axios = require("axios");
const crawl = require("./my_module/crawler");

const args = process.argv.slice(2);
if (args[0] == "resume") {
  crawl.resumeCrawl(args[1]);
} else if (args[0] == "test") {
  test();
} else {
  crawl.crawl(args[0], args[1], args[2], args[3], args[4], false, args[5]);
}

async function test() {
  url = "http://127.0.0.1:8000/start_session";
  const { data } = await axios.get(url);
  sesId = data.data;
  crawl.crawl(
    "http://127.0.0.1:8000/seed_session",
    args[1],
    args[2],
    args[3],
    args[4],
    true,
    sesId
  );
}
