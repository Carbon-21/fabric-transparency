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

//retrieve last block in IPFS
window.getLatestIPFSBlock = async function () {
  //loading...
  document.getElementById("loader").style.display = "flex";

  //make request to the backend
  let url = `http://localhost:4000/ipfs/getLatestIPFSBlock`;
  var init = {
    method: "GET",
  };
  let response = await fetch(url, init);

  //stop loading
  document.getElementById("loader").style.display = "none";

  if (response.ok) {
    response = await response.json();

    //set block info in HTML
    document.getElementById("flash").innerHTML = successFlashMessage;
    ipfsBlockNumber.innerText = String(response.tail.info.height - 1);
    ipfsHash.innerText = response.tail.info.currentBlockHash;
    ipfsPreviousHash.innerText = response.tail.info.previousBlockHash;

    //timestamp to date
    let timestamp = new Date(response.tail.data.data[0].payload.header.channel_header.timestamp);
    timestamp = convertTZ(timestamp, "America/Sao_Paulo"); //convert to BR timezone
    timestamp = timestamp.getDate() + "/" + (timestamp.getMonth() + 1) + "/" + timestamp.getFullYear() + " " + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds();
    ipfsTimestamp.innerText = timestamp;

    //remove info from json, it doesn't belong to the original json
    delete response.tail.info;
    ipfsJson.innerText = JSON.stringify(response.tail, null, 4);
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage2;
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
        `<b> Origem: </b> <spam class="limit">${atob(element[2])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> Destino: </b> <spam class="limit">${atob(element[0])
          .match(/CN=([^,]*)/g)[0]
          .replace("CN=", "")}</spam> <br/>` +
        `<b> ID do Token: </b> <spam class="limit">${element[1]}</spam> <br/>` +
        `<b> Quantidade: </b><spam class="limit">${element[3]}</spam> <br/>` +
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
