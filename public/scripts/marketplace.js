let metadata;
let metadataArray = [];

async function marketplace() {
  const nftType = "0";

  //Habilita gif loader
  document.getElementById("loader").style.display = "flex";
  
  // Recuperar todos os nfts com status "sale"
  let nftPrice = await getNftOnSalePrice(nftType);
  let nftMetadata = await getNftOnSaleMetadata(nftType);

  console.log(nftPrice);
  console.log(nftMetadata);

  // Caso haja nfts
  if (nftMetadata && nftPrice) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (nftPrice.length === 0 ) {
      element +=
        '<center><h2><font color="#5f5f5f">Não existem NFTs à venda </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;   
    }     
    else{ 
      for (var index in nftPrice) {
        let nftinfo = "";

        let tokenId = nftPrice[index].id;
        let price =  parseInt(nftPrice[index].price);
        let taxPercentage =  parseInt(nftPrice[index].taxPercent);
        let priceWithTaxes = price + parseInt((taxPercentage/100)*price);

        for (var key in nftMetadata) {
          if (nftPrice[index].id === nftMetadata[key][0]){  
            nftinfo = JSON.parse(nftMetadata[key][1]);
          }
        }

        element +=
          '<div class="card shadow-lg mt-3">' +
            '<div class="card-body flex-column">' +
              '<div class="d-flex justify-content-between p-md-1">' +
                '<div class="d-flex flex-row">' +
                  '<div class="align-self-center">' +
                    '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
                  "</div>" +
                  "<div>" +
                      `<button class="accordion-button cursor-pointer" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target='#tk${tokenId.replace(/\s/g,"")}' aria-controls="tk${tokenId}"> 
                          <p>`;
                          if(nftPrice[index].nftType == "NFTComp"){
                            element +=                            
                            `${((nftinfo?.metadata?.alertCode !== 'null') && nftinfo?.metadata?.car && nftinfo?.metadata?.alertCode) ? `<a id="alert-link" class="d-inline-block" data-bs-toggle="tooltip" style="text-decoration: none;" title="Esse CAR possui alertas! Clique para ver mais." target="_blank" href="https://plataforma.alerta.mapbiomas.org/alerta/${nftinfo?.metadata?.alertCode}/car/${nftinfo?.metadata?.car}">
                              <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>
                              Alerts
                             </a> <br />` : ""}
                             <b> ID: </b>${tokenId.slice(1)} <br /> 
                             <b> Tipo: </b> ${nftPrice[index].nftType} <br />                            
                             <b> Área Total Compensavel(hectares): </b> ${nftinfo?.compensation_total_area} <br />
                             <b> Área Disponivel para Compensação (hectares): </b> ${nftinfo?.compensation_area_supply} <br /> 
                             <b> Estado da compensacao: </b> ${nftinfo?.compensation_state} <br />`;  
                          }else if(nftPrice[index].nftType == "NFTTerra"){
                             element +=                            
                             `${((nftinfo?.metadata?.alertCode !== 'null') && nftinfo?.metadata?.car && nftinfo?.metadata?.alertCode) ? `<a id="alert-link" class="d-inline-block" data-bs-toggle="tooltip" style="text-decoration: none;" title="Esse CAR possui alertas! Clique para ver mais." target="_blank" href="https://plataforma.alerta.mapbiomas.org/alerta/${nftinfo?.metadata?.alertCode}/car/${nftinfo?.metadata?.car}">
                                <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>
                                Alerts
                              </a> <br />` : ""}
                              <b> ID: </b>${tokenId.slice(1)} <br /> 
                              <b> Tipo: </b> ${nftPrice[index].nftType} <br />                            
                              <b> Área (hectares): </b> ${nftinfo?.metadata?.land_area} <br />
                              <b> Bioma: </b> ${nftinfo?.metadata?.phyto} <br /> 
                              <b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />`;  
                          }
                
                element +=  `</p>                                          
                      </button>` +
                    '<div class="d-flex flex-row gap-2">' +
                      `<button id="seeMoreButton${tokenId.slice(1)}" class="btn btn-primary btn-md" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target='#tk${tokenId.replace(/\s/g,"")}' aria-controls="tk${tokenId}" onclick='seeMoreButton("${tokenId.slice(1)}")'> 
                        Ver mais                                       
                      </button>` +
                      `<button id="buyButton${tokenId.slice(1)}" type="button" class="btn btn-primary btn-md" data-bs-toggle="modal" data-bs-target="#confirmation${tokenId.slice(1)}"> 
                        Comprar 
                      </button>`+

                    '</div>'+        
                    (await  renderMetadata(tokenId, nftinfo)) +
                  "</div>" +
                "</div>" +
                '<div class="d-flex flex-row">' +
                  '<div class="align-self-center" style="margin-right: 30px">' +
                    '<i class="fa-solid fa-coins fa-4x coin-icon"></i>'+
                  "</div>" +
                  '<div class="align-self-center">' +
                    `<h2 id="balanceHeader" class="h1 mb-0">${priceWithTaxes} C21 </h2>` +
                  '</div>' +
                '</div>' +
              "</div>" +
            "</div>" +
          "</div>" +
        "</div>"+

        `<div class="modal fade" id="confirmation${tokenId.slice(1)}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h1 class="modal-title fs-5" id="staticBackdropLabel">Confirmação de compra</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">`
              if(nftPrice[index].nftType == "NFTTerra" && nftinfo?.metadata?.alertCode){
                element +=                            
                `<p style="color: red; margin: 0px 4px; text-align: center"> Esse NFT de terra possui alertas! </p>
                <p style="color: red; margin: 0px 4px 12px; text-align: center"> Deseja prosseguir mesmo assim? </p>`;  
                };
                element +=   
                `<div class="d-flex flex-row"> 
                  <div class="align-self-center" style="margin-right: 30px"> 
                    <i class="fa-solid fa-coins fa-4x coin-icon"></i>
                  </div> 
                  <div class="align-self-center">
                    <b> Preço: </b> ${price} C21<br />
                    <b> Taxa: </b> ${parseInt(price*taxPercentage/100)} C21 <br /> 
                    <b> Total: </b> ${priceWithTaxes} C21<br />
                  </div>
                </div> 
              </div>`;
                
                element +=   
              `<div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button id="comprar" type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='buy("${tokenId}", "${nftPrice[index].nftType}")'>Confirmar</button>
              </div>
            </div>
          </div>
        </div>`;
      
        // Renderizar a cada nft carregado
        document.getElementById("nft-showroom").innerHTML = element;
        //Habilita card, pois algumas opções o desabilitam 
        document.getElementById("nft-showroom").style.display = "block";
      }
    }
  }
  else {
    console.log("HTTP Error ", response.status);
    return null;
  }
  

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
}

// Recuperar o preço e a taxa de todos os nfts com status "sale"
async function getNftOnSalePrice(NFTType) {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://localhost:4000/query/channels/mychannel/chaincodes/erc1155/GetStatus?status=sale&NFTType=${NFTType}`;

  var init = {
    method: "GET",
    headers: headers,
  };
 
  let response = await fetch(url, init)

  let result = (await response.json())?.result;
  if(result){
    result = JSON.parse(result);
  }

  let nftArray = [];
  // Retornar array contendo somente a lista de ids dos nfts
  for (var i in result) {
    let nftMarketData = {
      id: result[i][1], // [1] id [2] ?? [3] NftType [4] Price [5] taxPercent
      nftType: result[i][3],       
      price: result[i][4], 
      taxPercent: result[i][5],
    };

    nftMarketData.id = "_" + nftMarketData.id;

    nftArray = nftArray.concat(nftMarketData);
  }

  return nftArray;
}

// Recupera os metadados dos nfts com status = sale
async function getNftOnSaleMetadata(nftType) {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://localhost:4000/query/channels/mychannel/chaincodes/erc1155/GetNFTsFromStatus?status=sale&NFTType=${nftType}`;
  var init = {
    method: "GET",
    headers: headers, 
  };

  let response = await fetch(url, init);
  let result = (await response.json());

  let nftArray = [];

  if (Object.keys(result).length !== 0){
    // Retornar array contendo somente a lista de ids dos nfts
    for (var i in result) {
      nftArray = nftArray.concat(result[i]);
    }
    
    for (var el in nftArray){
      // Adiciona um _ na frente dos ids para evitar problemas de nomeclatura de ID com HTML4 (Ids iniciando com numeros não sao aceitos)    
      nftArray[el][0] = "_"+ nftArray[el][0];
    }
  }
    
  return nftArray;
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId, nftinfo, nfttype) {

  // Metadados do nft de terra
  if(nfttype == "NFTTerra"){
    if (!nftinfo.amount) return "Metadados não recuperados";
    return (
      `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" style="margin-top: 20px;" aria-labelledby="headingOne" data-bs-parent="#accordionExample">` +
        '<div class="accordion-body">' +
          "<p>" +
            `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
            `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
            `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
            renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state) +
          "<p>" +
        "</div>" +
      "</div>"
    );
  }
  // Metadados do nft de compensacao ambiental
  else if(nfttype == "NFTComp"){
    if (!nftinfo.amount) return "Metadados não recuperados";
    return (
      `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" style="margin-top: 20px;" aria-labelledby="headingOne" data-bs-parent="#accordionExample">` +
        '<div class="accordion-body">' +
          "<p>" +
            `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
            `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
            `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
            renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state) +
          "<p>" +
        "</div>" +
      "</div>"
    );
  }
  else{

  }
}

// Retorna string do metadado de compensação, dependendo do estado
function renderCompensation(tokenId, compensation_state) {
  switch (compensation_state) {
    case "Aguardando":
      return `<b> Estado de compensação:</b> Aguardando <br />`;
    case "Compensado":
      return `<b> Estado de compensação:</b> Compensado <br />`;
    case "Não Compensado":
    default:
      return (
        `<b> Estado de compensação:</b> Não compensado <br />`
      );
  }
}

//Controla estado do botão "ver mais"
function seeMoreButton(tokenId){
  let element = document.getElementById(`seeMoreButton${tokenId.replace(/\s/g,"")}`).innerHTML;

  if (element.replace(/\s/g, "") === 'Vermais' )
  {
    element = 'Ver menos'; 
    document.getElementById(`seeMoreButton${tokenId.replace(/\s/g,"")}`).innerHTML = element;
  }
  else
  {
    element = 'Ver mais'; 
    document.getElementById(`seeMoreButton${tokenId.replace(/\s/g,"")}`).innerHTML = element;
  }
}

// função de compra do nft
async function buy(tokenIdInput, nftType){
  document.getElementById("nft-showroom").style.display = "none";
  document.getElementById("loader").style.display = "flex";

  tokenIdValue = (tokenIdInput).slice(1);

  let jwt = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Authorization", "Bearer " + jwt);
  headers.append("Content-Type", "application/json");

  let url = `https://localhost:4000/invoke/channels/mychannel/chaincodes/erc1155/Buy`;
  
  var init = {
    method: "POST",
    headers: headers,
  };

  body = {
    tokenId: tokenIdValue,
    nftType: nftType,
  }; 

  init.body = JSON.stringify(body);

  let response = await fetch(url, init);
  
  if (response.ok) {
    
    response = await response.json();
    if (response.result !== "success") {
      await marketplace();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro na compra do produto` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await marketplace();
      let element =
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Compra do produto realizada com sucesso` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    }
  }
  else {
    document.getElementById("loader").style.display = "none";
    console.log("HTTP Error ", response.status);
    await marketplace();
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro na compra do produto` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }

}

