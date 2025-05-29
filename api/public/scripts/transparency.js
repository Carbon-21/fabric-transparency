let sha = require("js-sha256");
let asnjs = require("asn1.js");

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
      ipfsPublicationStatusDiv.innerHTML = `
        <div class="alert alert-success mt-3">
          ✅ Content retrieved from IPFS!<br>
          <details>
            <summary><strong>World State</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[3]}</code></pre>
          </details>
          <details>
            <summary><strong>Tail</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[2]}</code></pre>
          </details>
          <strong>Previous CID:</strong> 
            ${responseData.content[0] ? responseData.content[0] : "None"}
          <details>
            <summary><strong>Signature</strong></summary>
            <pre><code class="content" id="blockJson">${responseData.content[1]}</code></pre>
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
          <strong>CID:</strong> 
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

//retrieve all blocks, hash them and check if the resulting hashes match the retrieved ones
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

window.calculateFileHash = async function () {
  const fileInput = document.getElementById('contractFile');
  const hashResult = document.getElementById('hashResult');

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
      console.log(response)
  
    } 
    else {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("HTTP Error ", response.status);
      console.log(response);
    }

    ////// HASH FILE ///////
    // Display loading indicator
    hashResult.innerHTML = '<div class="d-flex align-items-center"><strong>Calculating hash...</strong><div class="spinner-border ms-auto" role="status" aria-hidden="true"></div></div>';
    let matchMessage = `The file hash does NOT match any smart contract deployment hash in the blockchain!`
    let deploymentsMessage = ""

    const file = fileInput.files[0];
    const arrayBuffer = await file.arrayBuffer();
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
        if (String(response.hashes[i][j]) == String(fileHash)) {
          matchMessage = `The file hash matches a smart contract deployment hash in block ${response.indexes[i]}!`;
        } 
      }
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
          <strong>CID:</strong> 
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
