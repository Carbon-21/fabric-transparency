async function collectionCompensation() {

  const nftType = "NFTComp";
  
  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftCompensationTokens();
  let orgNftTokens = await organizeFromNFTId(nftTokens);

  console.log(orgNftTokens);

  if (orgNftTokens) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (nftTokens.length === 0){
      element +=
        '<center><h2><font color="#5f5f5f">Você não possui NFT de compensação em sua coleção </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;        
    }else{
      for (var key in orgNftTokens) {
        let tokenNFTTerraId = orgNftTokens[key][0];
        element +=
          '<div class="card shadow-lg mt-3 ">' +
            '<div class="card-body flex-column">' +

                '<div class="d-flex  p-md-1">' +
                  `'<i class="fa-solid fa-tree fa-2x tree-icon">  ID NFT Terra: ${tokenNFTTerraId} </i>` +
                "</div>" ;

                for(var child in orgNftTokens[key][1]){
                    //console.log(orgNftTokens[key][1][child]);
                    let tokenNFTCompId = orgNftTokens[key][1][child][0];
                    let metadataNFTComp = JSON.parse(orgNftTokens[key][1][child][2])

                    // Verifica se o nft ja foi compensado para escolher a classe de pintar o card
                    if (metadataNFTComp.compensation_state == 'Compensado'){
                      element +=
                      '<div class="card compensated-card shadow-lg mt-3">';
                    }else{
                      element +=
                      '<div class="card shadow-lg mt-3">';
                    }


                      element +=   
                        '<div class="card-body flex-column">' +                
                          '<div class="d-flex justify-content-between p-md-1">' +
                            '<div class="d-flex flex-row">' +
                              '<div class="align-self-center">' +
                                '<i class="fa-solid fa-leaf fa-3x leaf-icon"></i>' +
                              "</div>" +
            
                              '<div class="overflow-hidden"> ' +
                                `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${tokenNFTCompId.replace(
                                  /\s/g,
                                  ""
                                )}" aria-controls="tk${tokenNFTCompId}"> 
                                         &nbsp;&nbsp;&nbsp; ID NFT Direito de Compensação: ${tokenNFTCompId.slice(1)} 
                            
                                </button>` + // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
                                await renderMetadata(tokenNFTTerraId,tokenNFTCompId,JSON.parse(orgNftTokens[key][1][child][2])) +
                              "</div>" +
                            "</div>" +
                          "</div>" +
                          "</div>" +
                        '</div>'+
                      '</div>'+

                      `<div class="modal fade" id="staticBackdrop${tokenNFTCompId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                      <div class="modal-dialog">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h1 class="modal-title fs-5" id="staticBackdropLabel">Modal title</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                          </div>
                          <div class="modal-body">
                            <b> Preço: </b>  C21<br />
                            <b> Taxa: </b>  C21 <br /> 
                            <b> Total: </b>  C21<br />
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='buy("${tokenNFTCompId}")'> Confirmar </button>
                          </div>
                        </div>
                      </div>
                    </div>`;
                      
                  


                }


          element += 
            '</div>'+
            '</div>'+            
          '</div>';
        
   
      }
      // Renderizar a cada nft carregado
      document.getElementById("nft-showroom").innerHTML = element;
      //Habilita card, pois algumas opções o desabilitam
      document.getElementById("nft-showroom").style.display = "block";
    }
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
}

// Organiza o Array dos NFT de compensacao para agrupalos pelos id dos NFTs de Terra
async function organizeFromNFTId(nftTokens){
 // Recebe o array de NFTs de compensacao e retorna um array 'mapeados' pelos ids dos nfts de terra
  const nftTerrasUnicos = new Map(); // Set armazena valores unicos

  for(let i = 0; i < nftTokens.length; i++){
    const idNftTerraAtual = nftTokens[i][1]; // Posicao do id de terra
    const nftCompTotal = nftTokens[i];

    // Verifica se aquele id ja foi inserido no map ou se precisa adicionar um novo
    if(!nftTerrasUnicos.has(idNftTerraAtual)){
      nftTerrasUnicos.set(idNftTerraAtual, []);
    }

    nftTerrasUnicos.get(idNftTerraAtual).push(nftCompTotal);
  }

  return Array.from(nftTerrasUnicos); // Arrays de tokens organizados pelo id Do Nft de terras
}

// Recupera os nfts do usuario logado
async function getNftCompensationTokens() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://localhost:4000/query/channels/mychannel/chaincodes/erc1155/SelfBalanceNFTCompensation`;
  var init = {
    method: "GET",
    headers: headers,
  };

  let response = await fetch(url, init);
  let result = (await response.json());
  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    nftArray = nftArray.concat(result[i]);
  }

  for (var el in nftArray){
    // Adiciona um _ na frente dos ids para evitar problemas de nomeclatura de ID com HTML4 (Ids iniciando com numeros não sao aceitos)    
    nftArray[el][0] = "_"+ nftArray[el][0];
  }
  return nftArray;
}


// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenTerraId,tokenCompensationId,nftinfo) {
  if (!nftinfo.compensation_total_area) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenCompensationId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `<b> Área Total (hectares): </b> ${nftinfo?.compensation_total_area} <br />` +
    `<b> Área Disponivel para Compensação (hectares): </b> ${nftinfo?.compensation_area_supply} <br />` +
    
    "<p>" +           
    await renderCompensation(tokenTerraId.replace(/\s/g, ""),tokenCompensationId.replace(/\s/g, ""), nftinfo?.compensation_state) +
    "</p>"+
    await renderListForSale(tokenCompensationId.replace(/\s/g, ""),"NFTComp",nftinfo) +    
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado
async function renderCompensation(tokenTerraId, tokenCompensationId, compensation_state) {

    switch (compensation_state) {
      case "Aguardando":
        return `<b> Estado de compensação:</b> Aguardando <br />`;
      case "Compensado":
        return `<b> Estado de compensação:</b> Compensado <br />`;
      // Inclui botão de compensação quando não compensado
      case "Não Compensado":
      default:
        return (
          `<b> Estado de compensação:</b> Não compensado <br />` +  
          '<b> Área a ser compensada(hectares): </b> <input type="text" name="compensationAmount" id="compensationAmount" class="form-control" required/> <br />'+
          `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" onclick='compensate("${tokenTerraId}", "${tokenCompensationId}")'>Compensar</button>`                  
        );
    }
 }


 async function compensate(tokenTerraId,  tokenCompensationId) {
  event.preventDefault();
  
    let compensationAmount = document.getElementById("compensationAmount").value;   

  //set loading
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitCompensationButton").style.display = "none";

  let element =
  `<div class="alert alert-warning alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Compensando...` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

  document.getElementById("flash").innerHTML = element;  
  tokenCompensationId = tokenCompensationId.slice(1);

  let jwt = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + jwt);
  let url = `https://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/compensateNFT`;
  
  var init = {
    method: "PATCH",
    headers: headers,
  };  


  let body = {
    tokenTerraId,
    tokenCompensationId,
    compensationAmount
  };

  init.body = JSON.stringify(body);

  //POST to postMetadata
  let response = await fetch(url, init);


  if (response.ok) {
    document.getElementById("loader").style.display = "none";
    response = await response.json();
    if (response.result !== "success") {
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro na compensação` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Compensado com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
    window.location.href = `/collectionCompensation`;
  } else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na compensação` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}

// ------ Collection
async function renderListForSale(tokenId, nftType, nftinfo) {

  let nftMintedList = await getNftOnStatus("minted",nftType);
  let nftSaleList = await getNftOnStatus("sale", nftType);

  let element ="";
  let taxPercentage;
  let taxObs = "";

  //tenta pegar o valor da taxa a partir de um nft "minted"
  if (nftMintedList) {
    
    if(nftMintedList.length!==0){
      taxPercentage = parseInt(nftMintedList[0].taxPercent);
      taxObs = "( Taxação = " + taxPercentage + "% )";
    }
  } 
  
  //tenta pegar a taxa a partir de um nft "sale"
  if(taxObs === "" && nftSaleList){

    if(nftSaleList.length!==0){
      taxPercentage = parseInt(nftSaleList[0].taxPercent);
      taxObs = "( Taxação = " + taxPercentage + "% )";
    }
  }

  if (nftSaleList){
    for (var key in nftSaleList) {
      if (tokenId.slice(1) == nftSaleList[key].id){
        element += 
          `<b> Estado na loja :</b> Disponível <br />

          <span style="display: inline-block;">
            <button id="setMinted${tokenId}" type="button" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" onclick='setStatus("${tokenId}","minted",1,"${nftType}")'> Retirar da loja </button>       
          </span>

          <span style="display: inline-block;">
            <button id="setStatusButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" > Editar preço </button>       
          </span>`
      }
    }
  }

  if (element===""){
    if(nftinfo.compensation_state != 'Compensado'){
      element +=
    
      `<b> Estado na loja :</b> Indisponível <br />
      <span style="display: inline-block;">
        <button id="lisForSaleButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" > Anunciar </button>
      </span>`
    }
  }

  return(
    element += 
    `<div id="setPriceForm${tokenId}" class="validated-form collapse">` +

    
      
       '<div class="flex-fill">'+
          `<label class="form-label" for="price">Insira o preço em C21 ${taxObs}</label>`+ 
          '<br />'+
          '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
            '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
          '<span style="display: inline-block;">'+
            '<input type="text" name="priceInput" id="priceInput" class="form-control" required/>'+
          '</span>'+  
       '</div>'+

     '<!-- <div class="flex-fill">'+
     `<label class="form-label" for="price">Colocar toda área do direito de compensação a venda ?}</label>`+ 
     '<br />'+
     '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
       '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
     '<span style="display: inline-block;">'+
        '<fieldset>'+
          '<input type="radio" name="totalAreaSim" id="totalAreaSim" value="sim" >'+
          '<label for="totalAreaSim">Sim</label>'+

          '<input type="radio" name="totalAreaNao" id="totalAreaNao" value="nao" >'+
          '<label for="totalAreaNao">Não</label>'+
        '</fieldset>'+
    '</span>'+  
   '</div>'+  

   '<div class="flex-fill">'+
   `<label class="form-label" for="price">Insira a quantidade (em hectares) do direito a ser colocada a venda}</label>`+ 
   '<br />'+
   '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
     '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
   '<span style="display: inline-block;">'+
     '<input type="text" name="areaInput" id="areaInput" class="form-control" required/>'+
  '</span>'+  
 '</div>'+     

       '<div class="flex-fill">'+
        `<label class="form-label" for="price">Permitir compra fracionada ?</label>`+ 
        '<br />'+
        '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
          '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
        '<span style="display: inline-block;">'+
        '<fieldset>'+
          '<input type="radio" name="compraFraqSim" id="compraFraqSim" value="sim" >'+
          '<label for="compraFraqSim">Sim</label>'+

          '<input type="radio" name="compraFraqNao" id="compraFraqNao" value="nao" >'+
          '<label for="compraFraqNao">Não</label>'+
        '</fieldset>'+
         '</span>'+  
      '</div>'+

      '<div class="flex-fill">'+
      `<label class="form-label" for="price">Exigir uma fração minima de compra ?</label>`+ 
      '<br />'+
      '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
        '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
      '<span style="display: inline-block;">'+
          '<fieldset>'+
          '<input type="radio" name="fraqMinSim" id="fraqMinSim" value="sim" >'+
          '<label for="fraqMinSim">Sim</label>'+

          '<input type="radio" name="fraqMinNao" id="fraqMinNao" value="nao" >'+
          '<label for="fraqMinNao">Não</label>'+
        '</fieldset>'+
       '</span>'+  
    '</div>'+

    '<div class="flex-fill">'+
    `<label class="form-label" for="price">Valor da fração minima (em hectares)</label>`+ 
    '<br />'+
    '<span style="display: inline-block; margin-right: 10px; margin-top: 10px">'+
      '<i class="fas fa-coins fa-lg" aria-hidden="true"></i>'+'</span>'+
    '<span style="display: inline-block;">'+
      '<input type="text" name="priceInput" id="priceInput" class="form-control" required/>'+
     '</span>'+  
  '</div> --!>'+

        `<span style="display: inline-block; margin-right: 10px;  margin-top: 20px">`+
          `<button id="confirmPriceButton" type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#staticBackdrop${tokenId}" onclick='renderModal("${taxPercentage}","${tokenId}","${nftType}")'> Enviar </button>`+
        '</span>'+
      '<span style="display: inline-block;">'+
        `<button id="CancelOfferButton" type="button" style="display: flex" class="btn btn-primary btn-md" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}">Cancelar</button>`+
      '</span>'+
    `</div>`
  );

}

// Recuperar todos os nfts com status "sale"
async function getNftOnStatus(status, nftType) {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://localhost:4000/query/channels/mychannel/chaincodes/erc1155/getStatus?status=${status}&NFTType=${nftType}`;

  var init = {
    method: "GET",
    headers: headers,
  };
 
  let response = await fetch(url, init);
  let result = (await response.json())?.result;
  if(result){
    result = JSON.parse(result);
  }

  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {

    let nftMarketData = {
      id: result[i][1],
      price: result[i][3],
      taxPercent: result[i][4],
    };

    nftArray = nftArray.concat(nftMarketData);
  }

  return nftArray;
}

async function renderModal(taxPercentage, tokenId, nftType) {


  let price = document.getElementById("priceInput").value;
  let taxes = parseInt(price*taxPercentage/100);
  let priceWithTaxes = parseInt(price)+taxes;
  let element=
     `<div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="staticBackdropLabel">Confirmação de postagem na loja</h1>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="d-flex flex-row"> 
              <div class="align-self-center" style="margin-right: 30px"> 
                <i class="fa-solid fa-coins fa-4x coin-icon"></i>
              </div> 
              <div class="align-self-center">
                <b> Preço: </b> ${price} C21<br />
                <b> Taxa: </b> ${taxes} C21 <br /> 
                <b> Total: </b> ${priceWithTaxes} C21<br />
              </div>
            </div> 
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button id="comprar" type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='setStatus("${tokenId}","sale",${price},"${nftType}")'>Confirmar</button>
          </div>
        </div>
      </div>`;

  document.getElementById(`staticBackdrop${tokenId}`).innerHTML = element;

}

async function setStatus(tokenIdInput, statusIn, priceIn, nftType) {
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = (tokenIdInput).slice(1);

  let priceValue = 1;

  if(statusIn === "sale"){
    priceValue = priceIn;
  }

  let jwt = localStorage.getItem("token");
  
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);
  headers.append("Content-Type", "application/json");

  let url = `https://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/setStatus`;

  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId: tokenIdValue,
    status: statusIn,
    price: priceValue,
    NFTType: nftType,
  }; 

  console.log(JSON.stringify(body));

  init.body = JSON.stringify(body);
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();
    if (response.result !== "success") {
      await collectionCompensation();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await collectionCompensation();
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ação finalizada com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  }
  else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    await collectionCompensation();
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}
