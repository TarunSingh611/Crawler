const search =require("./search/main")


const args = process.argv.slice(2);
if(args[0]=="global"){
  console.log("global")
  //search.globalSearch(args[1],args[2],args[3]);
}
else if(args[0]=="test")
{test();
  
}
else{
  search.sesSearch(args[0],args[1],args[2],args[3]);
}

async function test(){
 console.log("test")
}
