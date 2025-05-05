// Calls the API for the smart contract function that mints FT for every active NFT

window.requestNFT = async () => {
  event.preventDefault();
  
  // Hides the submit button and displays loading image while the transaction is processing.
  document.getElementById("loader").style.display = "flex";
  document.getElementById("submitButton").style.display = "none";
  
  let landOwner = document.getElementById("landOwner").value;
  let phyto = document.getElementById("phyto").value;
  let landArea = document.getElementById("landArea").value;
  let geolocation = document.getElementById("geolocation").value;
  let userNotes = document.getElementById("userNotes").value;
  let cpf = document.getElementById("cpf").value;
  let basin = document.getElementById("basin").value;
  let file = document.getElementById("file").files[0];

  let car = document.getElementById("car").value;
  console.log(car);

  var closeBtn = document.getElementById("close-button");
  var confirmBtn = document.getElementById("confirm-button");

  var popup = document.getElementById("popup")

  // Get user jwt token from the local storage
  let token = localStorage.getItem("token");
  let userId = localStorage.getItem("userId");
  let username = localStorage.getItem("username");

  async function handleRequest(alertCode = null) {
    // HTTP Request
    let headers = new Headers();
    headers.append("Authorization", "Bearer " + token);

    let url = `https://localhost:4000/nft/requests`;

    const formData = new FormData();

    formData.append("landOwner", landOwner);
    formData.append("landArea", landArea);
    formData.append("phyto", phyto);
    formData.append("geolocation", geolocation);
    formData.append("userNotes", userNotes);
    formData.append("userId", userId);
    formData.append("username", username);
    formData.append("file", file);
    formData.append("car", car);
    formData.append("alertCode", alertCode);
    formData.append("cpf", cpf);
    formData.append("basin", basin);

    var init = {
      method: "POST",
      headers: headers,
      body: formData
    };

    let response = await fetch(url, init);


    if (response.ok) {
      // Hides the loading image and displays the submit button again
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
      
      // Displays success messages
      let element =     
        `<div class="alert alert-success alert-dismissible fade show mb-3 mt-3" role="alert">`+
            `Solicitação emitida com sucesso!`+
            `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
        `</div>`
      document.getElementById("flash").innerHTML = element;
      
    } else {
  
      // Hides the loading image and displays the submit button again
      document.getElementById("submitButton").style.display = "flex";
      document.getElementById("loader").style.display = "none";
  
      console.log("HTTP Error ", response.status);
      // Displays error messages
      let element =     
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">`+
          `Ocorreu um erro na solicitação`+
          `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`+
      `</div>`
      document.getElementById("flash").innerHTML = element;
      return null;
    }
  }


  // Consult car on mapBiomas
  let mapBiomas = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql"

  let res = await fetch(mapBiomas, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  console.log("responseCAR", res.data);

  let alertCode = '';  

  if (alerts_count > 0){
    alertCode = res.data?.ruralProperty?.alerts[0].alertCode;
    // Hides the loading image and displays the submit button again
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
      await handleRequest(alertCode);
    }

    document.getElementById("modal-title").innerHTML = `Esse CAR possui ${alerts_count} alertas!`;
    document.getElementById("modal-link").href = `https://plataforma.alerta.mapbiomas.org/alerta/${alertCode}/car/${car}`;
    
    popup.style.display = "flex";


    return null;
  } else {
    await handleRequest();
  }


}