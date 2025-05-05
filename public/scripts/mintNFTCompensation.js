
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

const mintNFTCompensation = async () => {
  event.preventDefault();
  let token = localStorage.getItem("token");

  // Hides the submit button and displays loading image while the transaction is processing.
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";

  // HTTP Request
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  const idNFTTerra = document.getElementById("idNFTTerra").value.trim();

  async function handleRequest() {
    document.getElementById("loader").style.display = "flex";
    document.getElementById("submitButton").style.display = "none";

    let url = `https://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/mintnftcompensation`;

    var init = {
      method: "POST",
      headers: headers,
    };

    var body = {
      idNFTTerra: document.getElementById("idNFTTerra").value,
      compensationTotalArea: document.getElementById("compensationTotalArea").value,
      tokenReceiver: document.getElementById("compensationOwner").value
    };

    init.body = JSON.stringify(body);

    let responseStatus = await fetch(url, init);
    let response = await responseStatus.json();


    document.getElementById("loader").style.display = "none";
    document.getElementById("submitButton").style.display = "flex";
    if (!responseStatus.ok || response.result == null) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      return null;
    } else {
      document.getElementById("flash").innerHTML = successFlashMessage;
    }

      if (responseStatus.ok) {
        if (response.result!="success") {

          // Hides the loading image and displays the submit button again
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";

          // Displays error messages
          let element =     
          `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
              `Ocorreu um erro na emissao`+
              `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
          `</div>`
          document.getElementById("flash").innerHTML = element;
        } else {
          // Hides the loading image and displays the submit button again
          document.getElementById("submitButton").style.display = "flex";
          document.getElementById("loader").style.display = "none";
          
          // Displays success messages
          let element =     
            `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
                `C21 emitidos com sucesso`+
                `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
            `</div>`
          document.getElementById("flash").innerHTML = element;
        }
      } else {
        // Hides the loading image and displays the submit button again
        document.getElementById("submitButton").style.display = "flex";
        document.getElementById("loader").style.display = "none";

        console.log("HTTP Error ", response.status);
        // Displays error messages
        let element =     
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
            `Ocorreu um erro na emissao`+
            `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
        `</div>`
        document.getElementById("flash").innerHTML = element;
        return null;
      }

  }


  // pega os metadados do nft de terra e checa por alertas
  try {
    let url1 = `https://localhost:4000/query/getNftsChaincode`;

    var init = {
      method: "GET",
      headers: headers,
    };
    let responseNfts = await fetch(url1, init);

    let nfts = await responseNfts?.json();
    nfts = nfts.data;

    if (!responseNfts.ok || !nfts) {
      document.getElementById("flash").innerHTML = failureFlashMessage;
      return null;
    }

    const result = nfts.find((nft) => nft.id === idNFTTerra);

    console.log(result);

    let alertCode = result.nft.metadata.alertCode;
    let car = result.nft.metadata.car;


    var closeBtn = document.getElementById("close-button");
    var confirmBtn = document.getElementById("confirm-button");
  
    if (alertCode){
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
  
      // Displays modal
  
      closeBtn.onclick = function(){
        popup.style.display = "none";
      }
  
      confirmBtn.onclick = async function(){
        popup.style.display = "none";
        await handleRequest();
      }
  
      document.getElementById("modal-title").innerHTML = `Esse NFT de terra possui alertas!`;
      document.getElementById("modal-link").href = `https://plataforma.alerta.mapbiomas.org/alerta/${alertCode}/car/${car}`;
      
      popup.style.display = "flex";
    }
    
  } catch (error) {
    console.log(error);
  }  

  
  
}