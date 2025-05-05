let metadata;
let metadataArray = [];

async function collection() {
  const nftType = "NFTTerra";
  

/*  Inicializa status dos nfts = "minted". 
    - O status do NFT não é definido na sua criação e é preciso ter um status inicial 
    padrão para tirar o NFT da loja mudando o seu status "sale" para outro. 
    - A função que cria o status só pode ser utilizada pelo dono do nft, por isso ela 
    é chamada dentro da collection.  
    - Status: "minted" = NFT não está a venda; "sale" =  NFT à venda. 
*/
//  await setStatusMinted(0, nftType);  // ???? Essa funcao realmente se o parametro do id for 0 varre todos os nft e assinala uma string como minted ou sale mas nao salva isso em lugar nenhum

  // Recuperar todos os nfts do usuario
  let nftTokens = await getNftTokens();

  // Recuperar todos os nfts requests do usuario
  let nftRequests = await getNftRequests();
  // Caso haja nfts ou nft requests
  if (nftTokens || nftRequests) {
    let element = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (!nftTokens || nftTokens.length === 0){
      element +=
        '<center><h2><font color="#5f5f5f">Você não possui NFTs em sua coleção </font></h2> </center>'+
        "</div>";
        document.getElementById("nft-showroom").innerHTML = element;        
    }else{
      for (var key in nftTokens) {
        let tokenId = nftTokens[key][0];
        element +=
          '<div class="card shadow-lg mt-3 ">' +
          '<div class="card-body flex-column">' +
          '<div class="d-flex justify-content-between p-md-1">' +
          '<div class="d-flex flex-row">' +
          '<div class="align-self-center">' +
            '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
          "</div>" +
          '<div class="overflow-hidden"> ' +
          `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${tokenId.replace(
            /\s/g,
            ""
          )}" aria-controls="tk${tokenId}"> 
            <div>
              ${tokenId.slice(1)}
              ${(JSON.parse(nftTokens[key][1])?.metadata?.alertCode && JSON.parse(nftTokens[key][1])?.metadata?.car) && (
                `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>`
              )}
            </div>
           </button>` + // TokenID.slice(1) remove o _ colocado na frente do ID para nao ter problema na visualização
          await renderMetadata(tokenId,JSON.parse(nftTokens[key][1]),nftType) +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +

              
          `<div class="modal fade" id="staticBackdrop${tokenId}" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
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
                  <button type="button" class="btn btn-primary" data-bs-dismiss="modal" onclick='buy("${tokenId}")'> Confirmar </button>
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

    //Desabilitar gif do loader
    document.getElementById("loader").style.display = "none";

    let element2 = '<div class="d-flex flex-column justify-content-between p-md-1">';
    if (!nftRequests || nftRequests.length === 0){
      element2 +=
        '<center><h2><font color="#5f5f5f">Você não possui solitações de NFT</font></h2> </center>'+
        "</div>";
        document.getElementById("request-showroom").innerHTML = element2;        
    }else{
      nftRequests.requests.map((request) => {
        let requestId = request.id;
        // let username = request.username;
        let landOwner = request.landOwner;
        let landArea = request.landArea;
        let phyto = request.phyto;
        let geolocation = request.geolocation;
        let certificate = request.certificate;
        let status = request.requestStatus;
        let userNotes = request.userNotes;
        let adminNotes = request.adminNotes;
        let car = request.car;
        let alertCode = request.alertCode;

        const buffer = new Uint8Array(request.certificate.data);
        const blobTest = new Blob([buffer], { type: 'application/pdf'});

        element2 +=
          '<div class="card shadow-lg mt-3 ">' +
          '<div class="card-body flex-column">' +
          '<div class="d-flex justify-content-between p-md-1">' +
          '<div class="d-flex flex-row">' +
          '<div class="align-self-center">' +
            '<i class="fa-solid fa-tree fa-4x tree-icon"></i>' +
          "</div>" +
          '<div class="overflow-hidden"> ' +
          `<button class="accordion-button" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#tk${requestId}" aria-controls="tk${requestId}">
            <div>
              Solicitação ${requestId}
              ${((alertCode !== 'null') && car && alertCode) && (
                `<svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>`
              )}
            </div>
           </button>` +
          `<b> Status: </b> ${status} <br />` +
          `<div id="tk${requestId}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
          `${((alertCode !== 'null') && car && alertCode) ? `<a id="alert-link" class="d-inline-block" data-bs-toggle="tooltip" style="text-decoration: none;" title="Esse CAR possui alertas! Clique para ver mais." target="_blank" href="https://plataforma.alerta.mapbiomas.org/alerta/${alertCode}/car/${car}">
            <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>
            Alerts
          </a> <br />` : ""}` +
          `<b> Proprietário da Terra: </b> ${landOwner} <br />` +
          `<b> Área (hectares): </b> ${landArea} <br />` +
          `<b> Bioma: </b> ${phyto} <br />` +
          `<b> Geolocalização: </b> ${geolocation} <br />` +
          `<b> Dono dos direitos de Compensação: </b> ${landOwner} <br />` +
          `<div class="d-flex align-items-center">` +
          `<i class="fa fa-download fa-lg"></i>` +
          `<a id="cert" href="${URL.createObjectURL(blobTest)}" download="certificate.pdf">Download Certificate</a>` +      
          "</div>" +
          `<b> Notas usuário: </b> ${userNotes} <br />` +
          `<b> Notas admin: </b> ${adminNotes} <br />` +       
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>";

        // Renderizar a cada request carregado
        document.getElementById("request-showroom").innerHTML = element2;
        //Habilita card, pois algumas opções o desabilitam
        document.getElementById("request-showroom").style.display = "block";
      })
      //Desabilitar gif do loader2
      document.getElementById("loader2").style.display = "none";
    }
  }else {
    console.log("HTTP Error ");
    return null;
  }

  //Desabilitar gif do loader
  document.getElementById("loader").style.display = "none";
  document.getElementById("loader2").style.display = "none";
}

// Recupera os nfts do usuario logado
async function getNftTokens() {
  let token = localStorage.getItem("token");
  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `https://localhost:4000/query/channels/mychannel/chaincodes/erc1155/selfBalanceNFT`;
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

async function getNftRequests() {
  let token = localStorage.getItem("token");
  let userId = localStorage.getItem("userId");
  let headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("Authorization", "Bearer " + token);

  // trocar para variaveis de host e port
  let url = `https://localhost:4000/nft/requests/${userId}`;

  var init = {
    method: "GET",
    headers: headers
  };

  let response = await fetch(url, init);
  
  if (response.ok) {
    return await response.json();
  } else {
    console.log("HTTP Error ", response.status);
    return null;
  }
}

// Retorna string com a construção dos metadados de dado nft (em div accordion colapsavel)
async function renderMetadata(tokenId,nftinfo,nftType) {
  if (!nftinfo.amount) return "Metadados não recuperados";
  return (
    `<div id="tk${tokenId.replace(/\s/g, "")}" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample"> <div class="accordion-body">` +
    "<p>" +
    `${(nftinfo?.metadata?.alertCode && nftinfo?.metadata?.car) ? `<a id="alert-link" class="d-inline-block" data-bs-toggle="tooltip" style="text-decoration: none;" title="Esse CAR possui alertas! Clique para ver mais." target="_blank" href="https://plataforma.alerta.mapbiomas.org/alerta/${nftinfo?.metadata?.alertCode}/car/${nftinfo?.metadata?.car}">
      <svg id="Layer_1" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 122.89 111.55"><defs><style>.cls-1{fill:#b71616;}.cls-2{fill:#e21b1b;fill-rule:evenodd;}.cls-3{fill:#fff;}</style></defs><title>Esse CAR possui alertas! Clique para ver mais.</title><path class="cls-1" d="M2.35,84.43,45.29,10.2l.17-.27h0a22.92,22.92,0,0,1,7-7.23A17,17,0,0,1,61.58,0a16.78,16.78,0,0,1,9.11,2.69,22.79,22.79,0,0,1,7,7.26c.13.21.25.42.36.64l42.24,73.34.23.44h0a22.22,22.22,0,0,1,2.37,10.19,17.59,17.59,0,0,1-2.16,8.35,16,16,0,0,1-6.94,6.61l-.58.26a21.34,21.34,0,0,1-9.11,1.74v0H17.62c-.23,0-.44,0-.66,0a18.07,18.07,0,0,1-6.2-1.15A16.46,16.46,0,0,1,3,104.26a17.59,17.59,0,0,1-3-9.58,23,23,0,0,1,1.57-8.74,8.24,8.24,0,0,1,.77-1.51Z"/><path class="cls-2" d="M9,88.76l43.15-74.6c5.23-8.25,13.53-8.46,18.87,0l42.44,73.7c3.38,6.81,1.7,16-9.34,15.77H17.62c-7.27.18-12-6.19-8.64-14.87Z"/><path class="cls-3" d="M57.57,82.7a5.51,5.51,0,0,1,3.48-1.58,5.75,5.75,0,0,1,2.4.35,5.82,5.82,0,0,1,2,1.31,5.53,5.53,0,0,1,1.62,3.55,6.05,6.05,0,0,1-.08,1.4,5.54,5.54,0,0,1-5.64,4.6,5.67,5.67,0,0,1-2.27-.52,5.56,5.56,0,0,1-2.82-2.94,5.65,5.65,0,0,1-.35-1.27,5.83,5.83,0,0,1-.06-1.31h0a6.19,6.19,0,0,1,.57-2,4.57,4.57,0,0,1,1.13-1.56Zm8.16-10.24c-.2,4.79-8.31,4.8-8.5,0-.82-8.21-2.92-29.39-2.85-37.1.07-2.38,2-3.79,4.56-4.33a12.83,12.83,0,0,1,5,0c2.61.56,4.65,2,4.65,4.44v.24L65.73,72.46Z"/></svg>
      Alerts
    </a> <br />` : ""}` +
    `<b> Status: </b> ${nftinfo?.metadata?.status} <br />` +
    `<b> Proprietário da Terra: </b> ${nftinfo?.metadata?.land_owner} <br />` +
    `<b> Área (hectares): </b> ${nftinfo?.metadata?.land_area} <br />` +
    `<b> Bioma: </b> ${nftinfo?.metadata?.phyto} <br />` +
    `<b> Geolocalização: </b> ${nftinfo?.metadata?.geolocation} <br />` +
    `<b> Dono dos direitos de Compensação: </b> ${nftinfo?.metadata?.compensation_owner} <br />` +
    `<b> Geração de C21: </b> ${nftinfo?.metadata?.mint_sylvas} <br />` +    
    `<b> Potencial de geração de C21: </b> ${nftinfo?.metadata?.mint_rate} <br />` +        
    `<b> Tipo do NFT: </b> ${nftinfo?.metadata?.nft_type} <br />` +        
    `<b> Notas: </b> ${nftinfo?.metadata?.custom_notes} <br />` +
    // "<p>" +           (old)
    //await renderCompensation(tokenId.replace(/\s/g, ""), nftinfo?.metadata?.compensation_state, nftinfo?.metadata?.nft_type) +
    "<p>" +
    await renderListForSale(tokenId.replace(/\s/g, ""),nftType) +    
    "<p>" +
    "</div>"
  );
}

// Retorna string do metadado de compensação, dependendo do estado (old - retirar)
/*async function renderCompensation(tokenId, compensation_state, nft_type) {
  if(nft_type === "corte"){
    return `<b> Estado de compensação:</b> Não permitido <br />`;
  }else{
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
          `<button id="submitCompensationButton" type="submit" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" onclick='compensate("${tokenId}")'>Compensar</button>`        
        );
    }
  }
}*/ 

// Retorna metadado com estado da loja
async function renderListForSale(tokenId, nftType) {

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
    element +=
  
    `<b> Estado na loja :</b> Indisponível <br />
    <span style="display: inline-block;">
      <button id="lisForSaleButton${tokenId}" type="button" data-bs-toggle="collapse" aria-expanded="true" data-bs-target="#setPriceForm${tokenId}" aria-controls="setPrice" style="display: flex" class="btn btn-primary btn-md mt-2 mb-2" > Anunciar </button>
    </span>`
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
      await collection();
      let element =
        `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
        `Ocorreu um erro` +
        `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
        `</div>`;
      document.getElementById("flash").innerHTML = element;
    } else {
      await collection();
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
    await collection();
    let element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `Ocorreu um erro` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;
    return null;
  }
}

//change token status to "Compensado" in the IPFS
//OBS: funções de escrita e leitura dos metadados no IPFS foram feitas de maneira desiguais, deveriam receber/retornar mesma estrutura json. Por isso, apenas alguns campos são mantidos ao se compensar (ver variável body)
async function compensate(tokenId) {
  event.preventDefault();

  //set loading
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitCompensationButton").style.display = "none";

  let element =
  `<div class="alert alert-warning alert-dismissible fade show mb-3 mt-3" role="alert">` +
  `Compensando...` +
  `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
  `</div>`;

  document.getElementById("flash").innerHTML = element;  
  tokenId = tokenId.slice(1);

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
    tokenId,
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
    window.location.href = `/collection`;
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

//definir status como "minted" de todos os nfts sem status (tokenId = null) 
//ou de um nft que deve ser retirado da loja (tokenId !== null)
/* async function setStatusMinted(tokenId,nftType) {

  if (tokenId === 0){
   
    let nftTokens = await getNftTokens();
    let nftTokensMinted = await getNftOnStatus("minted",nftType);
    let nftTokensSale = await getNftOnStatus("sale",nftType);
    let currentStatus = "";

    if (nftTokens){

      if (nftTokens.length===0){return;}

      //se tiver tokens, verifica se o status deles são minted ou sale 
      for (var key in nftTokens) {

        currentStatus = "";
        let tokenId = nftTokens[key][0]; //peguei um token id

        if (nftTokensMinted){
          for (var key in nftTokensMinted) {//verifica se encontramos algum token id com status minted, que seja igual a esse

            if (tokenId.slice(1) === nftTokensMinted[key].id){ 
              currentStatus = "minted";
            }
          }
        }

        if(currentStatus === "" && nftTokensSale){ //se não tiver status minted, veremos se é sale
          for (var key in nftTokensSale) {
            if (tokenId.slice(1) === nftTokensSale[key].id){
              currentStatus = "sale";
            }
          }
        }

        if(currentStatus === ""){//se não tiver status minted ou sale, setstatus = minted
          await setStatus(tokenId,"minted",1,nftType);
        } 
      }
    } 
  }
  else{
    await setStatus(tokenId.slice(1),"minted",1,nftType);
  }

  return null;
} */


