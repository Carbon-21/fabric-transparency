async function selfBalance() {
  event.preventDefault();

  let tokenId = document.getElementById("id").value;
  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/selfBalance?tokenId=${tokenId}`;

  var init = {
    method: "GET",
    headers,
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    if (response.result == null) alert("Sync error");
    else {
      balanceHeader.innerText = response.result + " token(s)";
    }
  } else {
    element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `There is a problem with the query` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;

    console.log("HTTP Error ", response.status);
    return null;
  }
}

async function balance() {
  event.preventDefault();

  let tokenId = document.getElementById("id").value;
  let tokenOwner = document.getElementById("username").value;
  let tokenOwnerOrg = document.getElementById("org").value;
  let token = localStorage.getItem("token");

  let headers = new Headers();
  headers.append("Authorization", "Bearer " + token);
  let url = `http://localhost:4000/query/channels/channel1/chaincodes/chaincode/balance?tokenId=${tokenId}&tokenOwner=${tokenOwner}&tokenOwnerOrg=${tokenOwnerOrg}`;

  console.log(url);

  var init = {
    method: "GET",
    headers,
  };
  let response = await fetch(url, init);

  if (response.ok) {
    response = await response.json();

    if (response.result == null) alert("Sync error");
    else {
      balanceHeader.innerText = response.result + " token(s)";
    }
  } else {
    element =
      `<div class="alert alert-danger alert-dismissible fade show mb-3 mt-3" role="alert">` +
      `There is a problem with the query` +
      `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>` +
      `</div>`;
    document.getElementById("flash").innerHTML = element;

    console.log("HTTP Error ", response.status);
    return null;
  }
}
