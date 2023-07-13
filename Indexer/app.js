const indexer =require("./indexer/main")


const args = process.argv.slice(2);
if(args[0]=="resume"){
  indexer.resumeIndexer(args[1],args[2]);
}
else if(args[0]=="test")
{test();
  
}
else{
indexer.initIndexer(args[0],args[1],args[2]);
}

async function test(){
 console.log("test")
}
