let sha = require("js-sha256");
let asnjs = require("asn1.js");
// let cryptoBrowserify = require("crypto-browserify");
// let buffer = require('buffer');
// const fs = require("fs");
// const path = require("path");

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successFlashMessage =
  `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Successful request` +
  `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Failed request` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage2 =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Nenhum bloco foi adicionado ainda ao IPFS` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

//retrieve the content of a CID
window.getCidContent = async function () {
  let cidNumber = cid.value;
  
  const ipfsPublicationStatusDiv = document.getElementById("getCid");
  ipfsPublicationStatusDiv.innerHTML = ''; 

  // Display loading indicator
  ipfsPublicationStatusDiv.innerHTML = `
    <div class="d-flex align-items-center text-primary">
      <strong>Retrieving from IPFS...</strong>
      <div class="spinner-border ms-2" role="status"></div>
    </div>`;

  try {
    const response = await fetch(`/ipfs/getCidContent?cid=${cidNumber}`, {
      method: "GET"
    });

    const responseData = await response.json();
    if (response.ok && responseData.success) {
      // await verify(responseData);
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-success mt-3">
          ✅ Content retrieved from IPFS!<br>
          <details>
            <summary><strong>World State</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[5]}</code></pre>
          </details>
          <details>
            <summary><strong>Tail</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[4]}</code></pre>
          </details>
          <strong>First CID:</strong> 
            ${responseData.content[2] ? responseData.content[2] : "Self."}
          <br/><strong>Previous CID:</strong> 
            ${responseData.content[3] ? responseData.content[3] : "None. This is the first IPFS publication."}
          <details>
            <summary><strong>Digital certificate (X509)</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[1]}</code></pre>
          </details>
          <details>
            <summary><strong>Signature</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[0]}</code></pre>
          </details>
        </div>`;
    } else {
      const errorMsg = responseData.message || 'Unknown error occurred';
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-danger mt-3">
          ❌ Error: ${errorMsg}
        </div>`;
    }
  } catch (error) {
    ipfsPublicationStatusDiv.innerHTML = `
      <div class="alert alert-danger mt-3">
        ❌ Network error: ${error.message || 'Could not connect to server'}
      </div>`;
  }
};

// NÃO FUNCIONA: crypto-browserify bugado
//check if the signature on an IPFS publication is valid. This requires doing RSA(SHA256(WS+tail+prev_cid))
async function verify(publication) {
  const content = publication.content[2].concat(publication.content[3],publication.content[0]);
  const signature = publication.content[1];
  // const cert = `-----BEGIN CERTIFICATE-----
  // MIIFrzCCA5egAwIBAgIUbyF0bDoIEjcPAZ4izfVJnGe4xckwDQYJKoZIhvcNAQEL
  // BQAwZzELMAkGA1UEBhMCQlIxCzAJBgNVBAgMAlNQMQswCQYDVQQHDAJTUDEWMBQG
  // A1UEAwwNY2FyYm9ubzIxLmNvbTEmMCQGCSqGSIb3DQEJARYXY2FyYm9ubzIxQGNh
  // cmJvbm8yMS5jb20wHhcNMjMwOTE4MTEwMjAzWhcNMzMwOTE1MTEwMjAzWjBnMQsw
  // CQYDVQQGEwJCUjELMAkGA1UECAwCU1AxCzAJBgNVBAcMAlNQMRYwFAYDVQQDDA1j
  // YXJib25vMjEuY29tMSYwJAYJKoZIhvcNAQkBFhdjYXJib25vMjFAY2FyYm9ubzIx
  // LmNvbTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMFh3X2U8l1daw5M
  // mw61C8pvzfUztENNH0HND04vmVfHbmTkxb7UqNCBQWOhA/C7SfQb2sOllxtKiIWc
  // n4AmZgaF5kvITas8Rc6fNjEu9dg53T5kYZNoVPLP095U8AG2CUX57Ug5dm0g+G6X
  // 9LuN1T3eBqW2Loa7q+G3HOt8xSjNBkbGEJsGf0OGtacgzb4RIdj+SCaxjPa98tpm
  // k1n2BJeh+1/gXwbXI4TLPzsdot4gGaAlrdfeWtMn46GxPK2PXxI63SLaGG1hKVJi
  // huMNkvfWfm/kxGrLuxIefg3xrVuQXtqiPEz9xyhZAU6BDqCqNTAylAnARoQs+wjn
  // DY60TryPuFntI2MMvTlHrwaMYnxac1scYfkvvPX4XDEdNMMtDIr5k+m/aB0KtKiR
  // KbwRAjvTLkw2WPbMKbMpDP5QVSFkqFRTyGvCHq/Bwb4SKFhnOU6ILIgvVJr3adgt
  // k4jm2IcdWRS/g2/A2oWKqzRvTcFYhoPXPdhW7jZfAFDdXjtY3guJImfUtJ4gLVY/
  // w4jwdMWDe24W/22QPNtjJIzKVQG5Jhn1lVmIDHJ0DNgPTIM7G/+zhcdI9RQGOQ8r
  // 7KTJWJHJ+lCUDOSztDXK1+kUV9EAhnyFLOElE17ajHe5j53A2tTQBxvPBPhB9uj7
  // 0PoDs68DEbjquWAz2FWCy5NoJrWtAgMBAAGjUzBRMB0GA1UdDgQWBBSywAzZVQKO
  // GhZzQdP9Lzt9pZ4l8jAfBgNVHSMEGDAWgBSywAzZVQKOGhZzQdP9Lzt9pZ4l8jAP
  // BgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3DQEBCwUAA4ICAQCbv+QxImL+NmTjYKCf
  // NwJzUMXUeqr1/kwvtE1XSAYuJgN/tojnTFGpi1I6xHejkYLh0b9EJiWFwA2cwGf3
  // Ww3sI0L4t7H/r51ieJ3saYlBvR12dpMIKebYZmtD79VFWRjsp2YEG4/LZR6RiMs5
  // lgpZx0C9pxRUs9mEV2YS4RlvtjcIySed6tTGoFPH7zFSx0oOXD3V7sRz7CmDO5LC
  // dBXWeOy1J6dtFIPGETbVWAzQPX7btsuc3B0NMveQPI3BFgEXiBrBiI+I4Q3MtwSl
  // E/6eWWjzf0hoql+pqwDAKE7GFtA61sYWAmQCpxRho5NCrHOfZ4GjNQgYC1C467aV
  // oh45+2MHC/4ntKTQV/Lzt3CPwQjIazOJ6kiwvVgEO+n5fDSZVfkVGAhaaFd9dHCM
  // eR4jzaxLGSTiKXt9NiK5kWzSkrwq5cZbLVWen/85pP6Qv9kJ8ao9tB0ivmIaJdki
  // GcYa+YQrSFwoYaXxtzxnMaf2QBKYArsWAPl8sGdHIVBOBAEoSYMynN5gtoRGAvbC
  // mn2ZdcmkjmPIOu6EwHM4UXws/YntWxRkh2Fod6kumkTm4XOTFq7PFaeJsvMHjrHo
  // lgq25gfvtlC52sjmdaRZx7Q8wR7KI57Fe9n6rOupglvdap4ikdT6dxiw4E6JeX/+
  // xXXP4/leAh6qMRnyAZPlhjc8Xg==
  // -----END CERTIFICATE-----`;
  
  // (async () => {
  // const publicKey = await importRSAPublicKeyFromPEM(cert);
  // const valid = await verifySignature(publicKey, signature, content);

  // console.log("Signature valid?", valid);
  // })();

  //////////////////////////
  let data = Buffer.from(content);
  // // const pubKey = crypto.createPublicKey(cert);
  // console.log("fs passou",pubKey);

  verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(data);
  console.log("fs passouaa",publication.pubKey);
  result = verifier.verify(publication.pubKey, signature, "base64");

  console.log("Resultado da verificação de assinatura:", result); //true or false

  /////////////////////////////////
  // Converting string to buffer
  // let data = Buffer.from(content);

  // Sign the data and returned signature in buffer
  // let signature = crypto.sign(algorithm, data, privateKey);

  // Verifying signature using crypto.verify() function
  // let isVerified = crypto.verify("RSA-SHA256", data, publication.pubKey, signature);
  // console.log(`Is signature verified: ${isVerified}`);

//////////////////////


  // let headerAsn = asnjs.define("headerAsn", function () {
  //   this.seq().obj(this.key("Number").int(), this.key("PreviousHash").octstr(), this.key("DataHash").octstr());
  // });

  // let output = headerAsn.encode(
  //   {
  //     Number: parseInt(header.number.low),
  //     PreviousHash: header.previous_hash.data,
  //     DataHash: header.data_hash.data,
  //   },
  //   "der"
  // );

  // let hash = sha.sha256(output);

  // return Buffer.from(hash, "hex").toString("base64");
}

//retrieve the content of an IPNS address (linked cid)
window.getIpnsContent = async function () {
  const ipfsPublicationStatusDiv = document.getElementById("ipnsGet");
  ipfsPublicationStatusDiv.innerHTML = ''; 

  // Display loading indicator
  ipfsPublicationStatusDiv.innerHTML = `
    <div class="d-flex align-items-center text-primary">
      <strong>Retrieving from IPNS...</strong>
      <div class="spinner-border ms-2" role="status"></div>
    </div>`;

  try {
    const response = await fetch('/ipfs/getIpnsContent?ipnsAddress=bafzaajaiaejca3hgs6skjaabaoy722sqoiadxmvqqekrzdaeioxjnl67qigowi43', {
      method: "GET"
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-success mt-3">
          ✅ Content retrieved from IPNS!<br>
          <strong>Content identifier (CID):</strong> 
            ${responseData.content}
          <button class="btn btn-sm btn-outline-secondary ms-2" 
                  onclick="navigator.clipboard.writeText('${responseData.content}')">
            Copy
          </button>
        </div>`;
    } else {
      const errorMsg = responseData.message || 'Unknown error occurred';
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-danger mt-3">
          ❌ Error: ${errorMsg}
        </div>`;
    }
  } catch (error) {
    ipfsPublicationStatusDiv.innerHTML = `
      <div class="alert alert-danger mt-3">
        ❌ Network error: ${error.message || 'Could not connect to server'}
      </div>`;
  }
}

//retrieve a block
window.getBlockByNumber = async function () {
  let block = blockNumber.value;
  

  //make request to the backend
  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getBlockByNumber?blockNumber=${block}`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    blockJson.innerText = JSON.stringify(response.block, null, 4);
    number.innerText = response.blockNumber;
    // blockHash.innerText = response.info.currentBlockHash;
    // blockPreviousHash.innerText = response.info.previousBlockHash;

    //timestamp to date
    let timestamp = new Date(response.block.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    blockTimestamp.innerText = timestamp;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//retrieve a block
window.getBlockByNumber = async function () {
  let block = blockNumber.value;
  

  //make request to the backend
  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getBlockByNumber?blockNumber=${block}`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    blockJson.innerText = JSON.stringify(response.block, null, 4);
    number.innerText = response.blockNumber;
    // blockHash.innerText = response.info.currentBlockHash;
    // blockPreviousHash.innerText = response.info.previousBlockHash;

    //timestamp to date
    let timestamp = new Date(response.block.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    blockTimestamp.innerText = timestamp;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//retrieve blockchains's last block
window.getBlockchainTail = async function () {
  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getBlockchainTail`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    tailJson.innerText = JSON.stringify(response.tail, null, 4);
    tailBlockNumber.innerText = String(response.info.height - 1);
    tailHash.innerText = response.info.currentBlockHash;
    tailPreviousHash.innerText = response.info.previousBlockHash;

    //timestamp to date
    let timestamp = new Date(response.tail.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    tailTimestamp.innerText = timestamp;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//get world state
window.getWorldState = async function () {
  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getWorldState`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    // get WS
    response = await response.json();
    if (response.result === "") return;

    //add each keys and values from the WS to the HTML
    let htmlOutput = "";
    response.result.forEach((element) => {
      htmlOutput =
        htmlOutput +
        "<p>" +
        `<b> From: </b> <spam class="limit">${atob(element[2])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> To: </b> <spam class="limit">${atob(element[0])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> Token ID: </b> <spam class="limit">${element[1]}</spam> <br/>` +
        `<b> Amount: </b><spam class="limit">${element[3]}</spam> <br/>` +
        "<p>";
    });
    ws.innerHTML = htmlOutput;

    document.getElementById("flash").innerHTML = successFlashMessage;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
  }
};

//retrieve all blocks, hash them and check if the resulting hashes match the retrieved ones. also, hash the first block on IPFS and compare it to the one provided by the blockchain network.
window.checkBlockchainAuto = async function () {
  let blocksDiv = document.getElementById("autoBlocks");
  blocksDiv.innerHTML = '';

  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getRangeOfBlocks?min=beginning&max=end`;
  var init = {
    method: "GET",
  };
  
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    blocksDiv.innerHTML += '- Retrieved all blocks from the blockchain...';

    //hash every block and check if they correspond to the previousHash field in the following block
    let blocksMatch = true;
    const numBlocks = response.max - response.min;

    for (let i = 0; i < numBlocks; i++) {
      //get hashes
      let calculatedHash = calculateBlockHash(response.blocks[i].header);
      let nextBlockPreviousHash = Buffer.from(response.blocks[i + 1].header.previous_hash).toString("base64");

      //uncomment if you want to test a non matching scenario
      // i === 1 ? (calculatedHash = "a1p4p41") : (calculatedHash = calculatedHash);

      //print if hashes match
      if (calculatedHash !== nextBlockPreviousHash) blocksMatch = false;
     
    }

    //print final result
    blocksMatch
      ? (blocksDiv.innerHTML += `<br/>- The block hashes match those sent by the blockchain network! ✅`)
      : (blocksDiv.innerHTML += `<br/>- The block hashes do not match those sent by the blockchain network! ❌`);


    //get first tail on IPFS
    const responseData = await fetch('/ipfs/getFirstTailOnIPFS', {
      method: "GET"
    });
    const firstTail = await responseData.json();

    if (!firstTail) blocksDiv.innerHTML += `<br/>- There are no publications on IPFS. Consider publishing under the tab "IPFS"! ⚠️<br/>Done.`
    else{
      //get block number
      const match = firstTail.match(/"low":\s*(\d+)/);
      const blockNumber = parseInt(match[1]);
      
      //hash the block
      const firstTailHeader = JSON.parse(firstTail).header;
      let firstTailHash = calculateBlockHash(firstTailHeader);

      //compare IPFS block and blockchain block
      // let calculatedHash = calculateBlockHash(response.blocks[i].header);
      firstTailHash === calculateBlockHash(response.blocks[blockNumber].header)
      ? (blocksDiv.innerHTML += `<br/>- The hash of the first tail published on IPFS (block #${blockNumber}) matches the hash of block #${blockNumber} provided by the blockchain network! ✅<br/>Done.`)
      : (blocksDiv.innerHTML += `<br/>- The hash of the first tail published on IPFS (block #${blockNumber}) DOES NOT match the hash of block #${blockNumber} provided by the blockchain network! ❌<br/>Done.`);

    }
    

    //requisition success message
    // document.getElementById("flash").innerHTML = successFlashMessage;
  } else {
    // document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
    console.log(response);
  }
};

//retrieve a range of blocks, hash them and check if the resulting hashes match the retrieved ones
window.checkBlockchain = async function () {
  //get requested values
  let minHtml = min.value;
  let maxHtml = max.value;

  //make request to the backend
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getRangeOfBlocks?min=${minHtml}&max=${maxHtml}`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    //hash every block and check if they correspond to the previousHash field in the following block
    let checkedBlocksHtml = "";
    let blocksMatch = true;
    const numBlocks = response.max - response.min;

    for (let i = 0; i < numBlocks; i++) {
      //get hashes
      let calculatedHash = calculateBlockHash(response.blocks[i].header);
      let nextBlockPreviousHash = Buffer.from(response.blocks[i + 1].header.previous_hash).toString("base64");

      //uncomment if you want to test a non matching scenario
      // i === 3 ? (calculatedHash = "a1p4p41") : (calculatedHash = calculatedHash);

      //print hashes
      checkedBlocksHtml += `Block ${i + response.min}, hash calculated by your computer: ${calculatedHash}<br>`;
      checkedBlocksHtml += `Block ${i + response.min + 1}, previous_hash: ${nextBlockPreviousHash}<br>`;

      //print if hashes match
      if (calculatedHash === nextBlockPreviousHash) {
        checkedBlocksHtml += `<span style="color:green">Block ${i + response.min} OK</span><br><br>`;
      } else {
        checkedBlocksHtml += `<span style="color:red ">Block ${i + response.min} not ok!</span><br><br>`;
        blocksMatch = false;
      }
      blockchainChecking.innerHTML = checkedBlocksHtml;
    }

    //print final result
    blocksMatch
      ? (blockchainChecking.innerHTML = `<span style="color:green">The block hashes match those sent by the blockchain network</span><br><br>` + blockchainChecking.innerHTML)
      : (blockchainChecking.innerHTML = `<span style="color:red ">The block hashes do not match those sent by the blockchain network</span><br><br>` + blockchainChecking.innerHTML);

    //requisition success message
    document.getElementById("flash").innerHTML = successFlashMessage;
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    console.log("HTTP Error ", response.status);
    console.log(response);
  }
};

//check if chaincode deployed matches the one on github repository
window.calculateFileHashAuto = async function () {
  const ccDiv = document.getElementById("autoCC");
  ccDiv.innerHTML = '';
  let match = false;
  
  
  try {
    //get smart contract from github
    const arrayBuffer = await downloadChaincode();

    ccDiv.innerHTML += `- Smart contract retrieved from <a href="https://github.com/Carbon-21/fabric-transparency/blob/main/chaincode/chaincode.tgz">Github</a>...`

    ///// GET BLOCKS WITH CHAINCODE DEPLOYMENT ////
    //make request to the backend
    let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getBlocksWithChaincodeDeployment`;
    var init = {
      method: "GET",
    };
    let response = await fetch(url, init);

    if (response.ok) {
      response = await response.json();  
    } 
    else {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("HTTP Error ", response.status);
    }

    
    // Hash then convert to hex string
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Go through all chaincode deployments in the blockchain
    for (let i = 0; i < response.hashes.length; i++) {

      // A block may contain more than one chaincode deployment
      for (let j = 0; j < response.hashes[i].length; j++) {

        // Check if the file hash matches a deployment hash in the blockchain
        if (String(response.hashes[i][j]) == String(fileHash)) match = true;
        else match = false;
      }

      if (!match) ccDiv.innerHTML += `<br/>- The file hash does not any smart contract deployment hash in the blockchain... ❌ `
      else ccDiv.innerHTML += `<br/>- The file hash matches the latest smart contract deployment hash, in block ${response.indexes[i]}! ✅<br/>Done.`;

    }
  } catch (error) {
    console.log(error);
  }
  
}

//check if chaincode deployed matches the one uploaded
window.calculateFileHash = async function () {
  const hashResult = document.getElementById('hashResult');
  const fileInput = document.getElementById('contractFile');
  let match = false;

  if (!fileInput.files || fileInput.files.length === 0) {
    hashResult.innerHTML = '<div class="alert alert-warning">Please select a file first</div>';
    return;
  }

  try {
    ///// GET BLOCKS WITH CHAINCODE DEPLOYMENT ////
    //make request to the backend
    let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/getBlocksWithChaincodeDeployment`;
    var init = {
      method: "GET",
    };
    let response = await fetch(url, init);

    if (response.ok) {
      response = await response.json();  
    } 
    else {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("HTTP Error ", response.status);
    }

    ////// HASH FILE ///////
    // Display loading indicator
    hashResult.innerHTML = '<div class="d-flex align-items-center"><strong>Calculating hash...</strong><div class="spinner-border ms-auto" role="status" aria-hidden="true"></div></div>';
    let matchMessage = `The file hash does NOT match any smart contract deployment hash in the blockchain!`
    let deploymentsMessage = ""
    
    const file = fileInput.files[0];
    console.log("file",file)
    const arrayBuffer = await file.arrayBuffer();
    console.log("arrayBuffer",arrayBuffer)
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);

    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Go through all chaincode deployments in the blockchain
    for (let i = 0; i < response.hashes.length; i++) {

      // Show block info and content
      deploymentsMessage += `
          <br><strong>Block: </strong>${response.indexes[i]}<br>
          <strong>Hash value(s) of the chaincode(s) deployed in the block: </strong>${response.hashes[i]}<br>
          <details>
              <summary><strong>JSON</strong></summary>
              <pre><code class="content" id="tailJson">${JSON.stringify(response.blocks[i], null, 4)}</code></pre>
          </details>
          `

      // A block may contain more than one chaincode deployment
      for (let j = 0; j < response.hashes[i].length; j++) {

        // Check if the file hash matches a deployment hash in the blockchain
        if (String(response.hashes[i][j]) == String(fileHash)) match = true;
        else match = false;
      }

      if (!match) matchMessage = `<br/>The file hash does not any smart contract deployment hash in the blockchain... ❌ `
      else matchMessage = `<br/>The file hash matches the latest smart contract deployment hash, in block ${response.indexes[i]}! ✅`;

    }

    // Display results
    hashResult.innerHTML = `
              <div class="alert">
                <strong>${matchMessage}</strong><br><br>
                <strong>File: </strong>${file.name}<br>
                <strong>Size: </strong>${(file.size / 1024).toFixed(2)} KB<br>
                <strong>SHA-256 Hash (hex): </strong><span class="limit">${fileHash}</span><br><br>
                
                ${(response.indexes.length)} smart contract deployment(s) detected in the blockchain:

                ${deploymentsMessage}

              </div>`;

    document.getElementById("flash").innerHTML = successFlashMessage;
  } catch (error) {
    console.error('Error calculating hash:', error);
    hashResult.innerHTML = `<div class="alert alert-danger">Error calculating hash: ${error.message}</div>`;
    document.getElementById("flash").innerHTML = failureFlashMessage;
  }
};

window.postTransparencyLog = async function () {
  const ipfsPublicationStatusDiv = document.getElementById("ipfsPublicationStatus");
  ipfsPublicationStatusDiv.innerHTML = ''; 

  // Display loading indicator
  ipfsPublicationStatusDiv.innerHTML = `
    <div class="d-flex align-items-center text-primary">
      <strong>Publishing to IPFS...</strong>
      <div class="spinner-border ms-2" role="status"></div>
    </div>`;

  try {
    const response = await fetch('/ipfs/postTransparencyLog', {
      method: "POST"
    });

    const responseData = await response.json();
    
    if (response.ok && responseData.success) {
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-success mt-3">
          ✅ Transparency log successfully published!<br>
          <strong>Content Identifier (CID):</strong> 
            ${responseData.cid}
          <button class="btn btn-sm btn-outline-secondary ms-2" 
                  onclick="navigator.clipboard.writeText('${responseData.cid}')">
            Copy
          </button>
        </div>`;
      // Create CID link to IPFS gateway
      // const cidLink = `https://ipfs.io/ipfs/${responseData.cid}`;
      
      // ipfsPublicationStatusDiv.innerHTML = `
      //   <div class="alert alert-success mt-3">
      //     ✅ Transparency log successfully published!<br>
      //     <strong>CID:</strong> 
      //     <a href="${cidLink}" target="_blank" class="text-break">
      //       ${responseData.cid}
      //     </a>
      //     <button class="btn btn-sm btn-outline-secondary ms-2" 
      //             onclick="navigator.clipboard.writeText('${responseData.cid}')">
      //       Copy
      //     </button>
      //   </div>`;
    } else {
      const errorMsg = responseData.message || 'Unknown error occurred';
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-danger mt-3">
          ❌ Failed to publish: ${errorMsg}
        </div>`;
    }
  } catch (error) {
    ipfsPublicationStatusDiv.innerHTML = `
      <div class="alert alert-danger mt-3">
        ❌ Network error: ${error.message || 'Could not connect to server'}
      </div>`;
  }
  
  // Ensure accordion stays open after operation
  // const accordion = new bootstrap.Collapse(document.getElementById('collapseThree'), {
    // show: true
  // });
};


///// AUX /////
function convertTZ(date, tzString) {
  return new Date((typeof date === "string" ? new Date(date) : date).toLocaleString("en-US", { timeZone: tzString }));
}

var calculateBlockHash = function (header) {
  let headerAsn = asnjs.define("headerAsn", function () {
    this.seq().obj(this.key("Number").int(), this.key("PreviousHash").octstr(), this.key("DataHash").octstr());
  });

  let output = headerAsn.encode(
    {
      Number: parseInt(header.number.low),
      PreviousHash: header.previous_hash.data,
      DataHash: header.data_hash.data,
    },
    "der"
  );

  let hash = sha.sha256(output);

  return Buffer.from(hash, "hex").toString("base64");
};

async function downloadChaincode() {
  try {
    const response = await fetch('https://raw.githubusercontent.com/Carbon-21/fabric-transparency/main/chaincode/chaincode.tgz')

    const arrayBuffer = await response.arrayBuffer();
    // const file = new Uint8Array(arrayBuffer); // this is the binary data
    return arrayBuffer;
  } catch (error) {
    console.log(error)
  }
}
//////////
async function importRSAPublicKeyFromPEM(pem) {
  console.log("a");
  // Remove header, footer, and line breaks
  const pemBody = pem
    .replace(/-----BEGIN CERTIFICATE-----/, '')
    .replace(/-----END CERTIFICATE-----/, '')
    .replace(/\s+/g, '');
    console.log("b");
  const binaryDer = atob(pemBody);
  const binaryDerBuffer = new Uint8Array(binaryDer.length);
  console.log("c");
  for (let i = 0; i < binaryDer.length; i++) {
    binaryDerBuffer[i] = binaryDer.charCodeAt(i);
  }
  console.log("d");
  // Import X.509 certificate and extract public key
  const cert = await window.crypto.subtle.importCert
    ? await window.crypto.subtle.importCert("x509", binaryDerBuffer.buffer)
    : await window.crypto.subtle.importKey(
        "spki",
        binaryDerBuffer.buffer,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256"
        },
        false,
        ["verify"]
      );
      console.log("e");
  return cert;
}

async function verifySignature(publicKey, signature, data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const sigBuffer = Uint8Array.from(atob(signature), c => c.charCodeAt(0));

  const isValid = await crypto.subtle.verify(
    {
      name: "RSASSA-PKCS1-v1_5"
    },
    publicKey,
    sigBuffer,
    dataBuffer
  );

  return isValid;
}