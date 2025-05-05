const client = require("./transaction-handler");

// Flash messages that are displayed to the user in case of success or failure of the transaction execution
const successFlashMessage =
  `<div  id="flash-message" class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Transação realizada com sucesso` +
  `<button id="flash-button" type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

const failureFlashMessage =
  `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Ocorreu um erro na execução da transação` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

/**
 * Calls Server or Client-Side Signing Mint functions depending on where the user chose
 * to store his Private Key (on his computer or on the server).
 */
window.mintFT = async () => {
  const keyOnServer = localStorage.getItem("keyOnServer");
  if (keyOnServer == "true") mintFTServerSideSigning();
  else mintFTClientSideSigning();
};

window.mintNFT = async () => {
  event.preventDefault();
  const keyOnServer = localStorage.getItem("keyOnServer");

  var closeBtn = document.getElementById("close-button");
  var confirmBtn = document.getElementById("confirm-button");
  let car = document.getElementById("car").value;

  // Consult car on mapBiomas
  let mapBiomas = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql";

  let res = await fetch(mapBiomas, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
    body: JSON.stringify({ query: `
      query {
        ruralProperty (
          propertyCode: "${car}"
        ){
          alerts {
            alertCode,
            detectedAt
          }
        }
      }`
    }),
  });

  res = await res.json()

  const alerts_count = res.data?.ruralProperty?.alerts?.length;

  let alertCode = '';  

  if (alerts_count > 0){
    alertCode = res.data?.ruralProperty?.alerts[0].alertCode;

    document.getElementById("submitButton").style.display = "flex";
    document.getElementById("loader").style.display = "none";

    // Displays modal

    closeBtn.onclick = function(){
      console.log("fechou");
      popup.style.display = "none";
    }

    confirmBtn.onclick = async function(){
      console.log("confirmou");
      popup.style.display = "none";
      console.log(alertCode);
      if (keyOnServer == "true") {
        mintNFTServerSideSigning(alertCode);
      } else {
        mintNFTClientSideSigning();
      }
    }

    document.getElementById("modal-title").innerHTML = `Esse CAR possui ${alerts_count} alertas!`;
    document.getElementById("modal-link").href = `https://plataforma.alerta.mapbiomas.org/alerta/${alertCode}/car/${car}`;
    
    popup.style.display = "flex";
  } else {
    if (keyOnServer == "true") {
      mintNFTServerSideSigning();
    } else {
      mintNFTClientSideSigning();
    }
  }
};

window.getRequest = async (requestId) => {
  event.preventDefault();
  localStorage.setItem("requestId", requestId);
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  let url = `https://${HOST}:${PORT}/nft/request/${requestId}`;

  var init = {
    method: "GET",
    headers: headers
  };

  let response = await fetch(url, init);

  if (response.ok) {
    let {request: req} = await response.json();
    let element1 = '';
    document.getElementById("landOwner").value = req.landOwner;
    document.getElementById("compensationOwner").value = req.landOwner;
    document.getElementById("username").value = req.username;
    document.getElementById("landOwner").ariaDisabled = '';
    document.getElementById("phyto").value = req.phyto;
    document.getElementById("phyto").ariaDisabled = '';
    document.getElementById("area").value = req.landArea;
    document.getElementById("area").ariaDisabled = '';
    document.getElementById("location").value = req.geolocation;
    document.getElementById("location").ariaDisabled = '';
    document.getElementById("car").value = req.car;
    document.getElementById("car").ariaDisabled = '';
    document.getElementById("basin").value = req.basin;
    document.getElementById("basin").ariaDisabled = '';
    document.getElementById("cpf").value = req.cpf;
    document.getElementById("cpf").ariaDisabled = '';

    if (req.alertCode && req.alertCode !== 'null') {
      document.getElementById("alert-display").style.display = "block";
      document.getElementById("alert-link").href = `https://plataforma.alerta.mapbiomas.org/alerta/${req.alertCode}/car/${req.car}`;
    }

    //if (req.alertCode) {
    //  document.getElementById("mintSylvasInativo").disabled = true;
    //  document.getElementById("mintSylvasAtivo").disabled = true;
    //  document.getElementById("mintSylvasAtivo").checked = true;
    //  document.getElementById("mintSylvasInativo").checked = true;
    //}

    if (req.userNotes){
      element1 +=
        `<div class="flex-fill">
            <div class="mint-data">
              <i class="fas fa-marker fa-lg"></i>
              <textarea name="userNotes" id="userNotes" placeholder=${req.userNotes} disabled="" class="form-control" rows="2" cols="50"></textarea>
            </div>
            <label for="userNotes">Notas do usuário:</label>
        </div>`;
      document.getElementById("userNotes-show").innerHTML = element1;     
    }
    if (req.adminNotes && (req.status !== "pending")){
      document.getElementById("customNotes").value = req.adminNotes;   
    }
    if (req.certificate){
      const buffer = new Uint8Array(req.certificate.data);
      const blobTest = new Blob([buffer], { type: 'application/pdf'});
      document.getElementById("cert").href = URL.createObjectURL(blobTest);
      document.getElementById("cert").download = `certificate.pdf`;
    } 
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
};

window.responseRequest = async (status) => {
  let token = localStorage.getItem("token");
  let requestId = localStorage.getItem("requestId");
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  let url = `https://${HOST}:${PORT}/nft/requests/${requestId}`;

  var init = {
    method: "PUT",
    headers: headers
  };

  const adminNotes = document.getElementById("customNotes").value;

  var body = {
    status,
    adminNotes
  };

  init.body = JSON.stringify(body);
  let response = await fetch(url, init);
  window.location.href = "/nft/frontrequests";

  if (response.ok) {
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
const mintFTClientSideSigning = async () => {
  if (localStorage.getItem("keyOnServer") == "false") {
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    document.getElementById("flash-button")?.click();
    event.preventDefault();

    let username = document.getElementById("username").value;
    let qty = document.getElementById("qty").value;

    // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
    let clientAccountId = `x509::CN=${username},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;

    // Base-64 encoding of clientAccountId
    clientAccountId = window.btoa(clientAccountId);

    const transaction = {
      chaincodeId: "erc1155",
      channelId: "mychannel",
      fcn: "Mint",
      args: [clientAccountId, "$ylvas", qty],
    };

    try {
      // Executes the transaction in Client-Side Signing Mode
      let response = await client.offlineTransaction(transaction);

      // Hides the loading image and displays the file upload fields again
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("submitButton").style.display = "block";
      document.getElementById("loader").style.display = "none";

      // Displays Flash Messages
      if (response.result == "SUCCESS") {
        document.getElementById("flash").innerHTML = successFlashMessage;
      } else {
        document.getElementById("flash").innerHTML = failureFlashMessage;
      }
    } catch (e) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("Error:", e.message);
    }
  }
};

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
const mintFTServerSideSigning = async () => {
  event.preventDefault();

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  let username = document.getElementById("username").value;
  let qty = document.getElementById("qty").value;

  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");

  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/mint`;

  var init = {
    method: "POST",
    headers: headers,
  };

  var body = {
    tokenId: "$ylvas",
    tokenAmount: qty,
    tokenReceiver: username,
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);

  document.getElementById("submitButton").style.display = "flex";
  document.getElementById("loader").style.display = "none";

  if (response.ok) {
    response = await response.json();
    if (response.result != "success") {
      document.getElementById("flash").innerHTML = failureFlashMessage;
    } else {
      document.getElementById("flash").innerHTML = successFlashMessage;
    }
  } else {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  }
};

/**
 * Executes "Mint" transaction in Client-Side Signing Mode.
 */
const mintNFTClientSideSigning = async (alertCode = null) => {
  if (localStorage.getItem("keyOnServer") == "false") {
    // Hides the file upload fields and displays loading image while the transaction is processing.
    document.getElementById("signing-files").style.display = "none";
    document.getElementById("submitButton").style.display = "none";
    document.getElementById("loader").style.display = "flex";
    document.getElementById("flash-button")?.click();

    // event.preventDefault();

    let username = document.getElementById("username").value;
    let qty = 1;
    // let nftId = document.getElementById("nftId").value;
    //let phyto = document.getElementById("phyto").value;
    //let location = document.getElementById("location").value;

    // Temporary way to get ClientAccountId while we don't know how to get it without needing the client's private key to access the Chaincode
    let clientAccountId = `x509::CN=${username},OU=client+OU=carbon+OU=department1::CN=fabric-ca-server,OU=Fabric,O=Hyperledger,ST=North Carolina,C=US`;

    // Base-64 encoding of clientAccountId
    clientAccountId = window.btoa(clientAccountId);

    const transaction = {
      chaincodeId: "erc1155",
      channelId: "mychannel",
      fcn: "Mint",
      // args: [clientAccountId, nftId, qty],
      args: [clientAccountId, "NFT", qty],
    };

    try {
      // Executes the transaction in Client-Side Signing Mode
      let response = await client.offlineTransaction(transaction);

      // Hides the loading image and displays the file upload fields again
      document.getElementById("signing-files").style.display = "block";
      document.getElementById("submitButton").style.display = "block";
      document.getElementById("loader").style.display = "none";

      // Displays Flash Messages
      if (response.result == "success") {
        responseRequest('accepted');
        document.getElementById("flash").innerHTML = successFlashMessage;
      } else {
        document.getElementById("flash").innerHTML = failureFlashMessage;
      }
    } catch (e) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      console.log("Error:", e.message);
    }
  }
};

/**
 * Executes "Mint" transaction in Server-Side Signing Mode.
 */
const mintNFTServerSideSigning = async (alertCode = null) => {
  // event.preventDefault();

  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  let username = document.getElementById("username").value;
  let qty = 1;
  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);
  let url = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/mint`;

  var init = {
    method: "POST",
    headers: headers,
  };

  var body = {
    tokenId: "NFT",
    tokenAmount: qty,
    tokenReceiver: username,
    metadata: {
      id: "NFT",
      status: alertCode ? `Bloqueado` : `Ativo`,
      //mint_sylvas:"Ativo",      
      mint_sylvas: document.querySelector("input[name='mintSylvas']:checked").value,      
      amount: qty,
      land_owner: document.getElementById("landOwner").value,
      mint_rate: document.querySelector("input[name='mintRate']").value,
      land_area: document.getElementById("area").value,
      phyto: document.getElementById("phyto").value,
      geolocation: document.getElementById("location").value,
      compensation_owner: document.getElementById("compensationOwner").value,
      compensation_state: "Não Compensado",
      custom_notes: document.getElementById("customNotes").value,
      nft_type: document.querySelector("input[name='nftType']:checked").value,
      car: document.getElementById("car").value,
      alertCode: alertCode ? alertCode : '', 
      basin: document.getElementById("basin").value,
      cpf: document.getElementById("cpf").value,
      username: username, 
      //certificate: document.getElementById("certificate").value,
    },
  };

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  let responseJson = await response.json();
  document.getElementById("loader").style.display = "none";
  document.getElementById("submitButton").style.display = "flex";
  if (!response.ok || responseJson.result == null) {
    document.getElementById("flash").innerHTML = failureFlashMessage;
    return null;
  } else {
    responseRequest('accepted');
    document.getElementById("flash").innerHTML = successFlashMessage;
  }



  // Post metadata through ipfs node
  // let metadata = {
  //   id: "NFT", //AQUI
  //   status: `Ativo`,
  //   amount: qty,
  //   land_owner: document.getElementById("landOwner").value,
  //   land: document.getElementById("area").value,
  //   phyto: document.getElementById("phyto").value,
  //   geolocation: document.getElementById("location").value,
  //   compensation_owner: document.getElementById("compensationOwner").value,
  //   compensation_state: "Não Compensado",
  // };

  // let postMetadataURL = `https://${HOST}:${PORT}/meta/postMetadata`;
  // init.body = JSON.stringify({
  //   metadata,
  //   tokenId: "NFT", //AQUI
  // });
  // let metadataResponse = await fetch(postMetadataURL, init);
  // let metadataResponseJson = await metadataResponse.json();

  // if (!metadataResponse.ok || metadataResponseJson.result != "success") {
  //   document.getElementById("submitButton").style.display = "flex";
  //   document.getElementById("loader").style.display = "none";
  //   document.getElementById("flash").innerHTML = failureFlashMessage;
  //   return null;
  // }

  // let metadataHash = metadataResponseJson.metadataHash;
  // // Publicar URI e TokenId no chaincode por meio de chamada em invoke controller (SetURI)
  // const URI = `http://${metadataHash}.com`;
  // let setUriURL = `https://${HOST}:${PORT}/invoke/channels/mychannel/chaincodes/erc1155/setURI`;
  // body = JSON.stringify({
  //   URI: URI,
  //   tokenId: "NFT", //AQUI
  // });
  // init = {
  //   method: "POST",
  //   headers: headers,
  //   body: body,
  // };

  // let setURIResponse = await fetch(setUriURL, init);

  // document.getElementById("submitButton").style.display = "flex";
  // document.getElementById("loader").style.display = "none";

  // if (!metadataResponse.ok || metadataResponseJson.result == null) {
  //   document.getElementById("flash").innerHTML = failureFlashMessage;
  //   return null;
  // }
};

