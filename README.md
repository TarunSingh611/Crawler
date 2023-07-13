# Crawler
made in NodeJS project Also contain indexer and a search 
for Crawler command line input 
- here two function can be called depend on input
  2) for regualr crawler command is :
           npm run start <seedUrl> <maximum depth (by default 3)><time limit to make n parallel request on same domain>
                          <n request to be made in a time limit on same domain> <no of total request to made at a time> <false>
                          <sessionID (to provide custom session is)>


  3) for resuming:
           resume <sessionID>



# INDEXER

1) node app.js <sessionID> <fcount set it 5 or less> <boolean true or flase if true it will overwrite any table made using simialr sessionID>
to resume:
2)nodejs app.js resume <sessionID> <fcount set it 5 or less>



#SEARCH

1) node app.js <sessionId> <word to search> <n (top n results)> <strict option if is written result needs to be same as searched word otherwise word can be a substring of th result >

