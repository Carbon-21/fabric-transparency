const logger = require("../util/logger");
const HttpError = require("../util/http-error");
const models = require("../util/sequelize");
// const { setURI } = require("../controllers/invoke-controller");
const helper = require("../app/helper");
const ipfs = require("../util/ipfs");
const axios = require("axios").default;
const fs = require("fs");

exports.getMetadata = async (req, res, next) => {
  let tokenId = req.query.tokenId;
  let token = req.headers["authorization"].split(" ")[1];
  let URI;

  // Hash por meio de query no chaincode (GetURI)
  axios
    .get(`https://${process.env.HOST}:${process.env.PORT}/query/channels/mychannel/chaincodes/erc1155/getURI?tokenId=${tokenId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
    .then(async function (response) {
      // Get hash (URI) from response
      URI = response.data;
      let metadata = await getMetadataFromURI(URI.result);
      if (Object.keys(metadata).length != 0) {
        return res.status(200).json({
          message: metadata,
          success: true,
        });
      } else {
        return res.status(404).json({ success: false });
      }
    })
    .catch(function (error) {
      logger.error(error);
      return res.status(500).json({
        message: "TokenID do NFT inválido",
        success: false,
      });
    });
};

async function getMetadataFromURI(URI) {
  const hashRegEx = /(?<=ipfs:\/\/).+/; // NOTE: correto, para quando a validacao de URI estiver corrigida
  let hash = hashRegEx.exec(URI);
  hash = hash || URI.slice(7, URI.length - 4); // temporario para remover o http:// e .com
  if (!hash) {
    logger.error("Não conseguimos recuperar o hash do URI fornecido");
    return null;
  }
  logger.debug("Hash received: " + hash);

  let metadata;
  try {
    let ipfsData = await ipfs.getMetadata(hash);
    metadata = (await ipfsData) ? JSON.parse(ipfsData) : null;
  } catch (error) {
    return next(new HttpError(500));
  }
  return metadata;
}

exports.postMetadata = async (req, res, next) => {
  // NOTE: Metadata to be put in IPFS
  let metadata;
  let token = req.headers["authorization"].split(" ")[1];
  let tokenId = req.body.tokenId;
  let hash;

  try {
    metadata = makeMetadata(req.body.metadata);
    tokenId = tokenId || metadata.properties.id;
    hash = await ipfs.uploadIPFS(metadata);
    logger.debug("TokenId: " + tokenId);
    logger.debug("Hash of uploaded Metadata: " + hash);
  } catch (error) {
    return next(new HttpError(500), "Falha na aquisição dos metadados");
    // logger.error(error);
    // return res.status(500).json({
    //   message: "Falha na aquisição dos metadados",
    //   success: false,
    // });
  }

  // Publicar URI e TokenId no chaincode por meio de chamada em invoke controller (SetURI)
  // req.body.URI = `ipfs://${hash}`;
  // await setURI(req, res, next);
  // return;

  const URI = `ipfs://${hash}`;
  axios
    .post(
      `https://${process.env.HOST}:${process.env.PORT}/invoke/channels/mychannel/chaincodes/erc1155/setURI`,
      JSON.stringify({
        tokenId: tokenId,
        URI: `http://${hash}.com`, // TODO: Deve se deixar no padrao, que eh somente o URI, mas a validacao impede nesse momento
      }),
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      }
    )
    .then(function (response) {
      logger.debug("Publicado Metadados - " + response.statusText);
      return;
      // return res.json({ ...response.data, message: "Publicado Metadados e URI setada" });
    })
    .catch(function (error) {
      logger.error("ERRORR", error);
      return next(new HttpError(500), "Falha na publicação dos metadados no chaincode");
      // return res.status(500).json({
      //   message: "Falha na publicação dos metadados no chaincode, URI: " + URI,
      //   success: false,
      // });
    });
};

// Metadata Schema v0.2
function makeMetadata(dto) {
  const customData = {
    id: dto.id || "",
    verifier: dto.verifier || "",
    private_verifier: dto.private_verifier || "",
    land_owner: dto.land_owner || "",
    // land_info: {
    phyto: dto.phyto || "",
    land: dto.land || "",
    geolocation: dto.geolocation || "",
    area_classification: dto.area_classification || "",
    // },
    // nft_info: {
    amount: dto.amount || "",
    status: dto.status || "",
    nft_type: dto.nft_type || "",
    value: dto.value || "",
    can_mint_sylvas: dto.can_mint_sylvas || "",
    sylvas_minted: dto.sylvas_minted || "",
    bonus_ft: dto.bonus_ft || "",
    // },
    compensation_owner: dto.compensation_owner || "",
    compensation_state: dto.compensation_state || "",
    certificate: dto.certificate || "",
    minter: dto.minter || "",
    queue: dto.queue || "",
    custom_notes: dto.custom_notes || "",
  };

  return {
    name: dto.id,
    description: "Carbon 21 NFT",
    image: dto.imageURL || "",
    properties: customData,
  };
}

///// NFT REQUESTS CONTROLLERS /////

// lista nft requests com filtro de requestStatus
exports.getNftRequests = async (req, res, next) => {
  const { requestStatus } = req.query;

  try {
    if (!requestStatus) {
      return next(new HttpError(400, "requestStatus is necessary."));
    }

    const requests = await models.nftRequests.findAll({
      where: { requestStatus },
    });

    return res.status(200).json({
      requests,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(404));
  }
};

// pega requests de um usuário
exports.getNftRequestsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  try {
    if (!userId) {
      return next(new HttpError(400, "userId is necessary."));
    }

    const requests = await models.nftRequests.findAll({
      where: { userId },
    });

    return res.status(200).json({
      requests,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(404));
  }
};

// retorna um nft requests através de seu id
exports.getNftRequest = async (req, res, next) => {
  const { requestId } = req.params;
  try {
    if (!requestId) {
      return next(new HttpError(400, "requestId is necessary."));
    }

    const request = await models.nftRequests.findByPk(requestId);

    return res.status(200).json({
      request,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(404));
  }
};

// atualiza o status de um nft request
exports.updateNftRequestStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;

  try {
    if (!id) {
      return next(new HttpError(400, "Id is necessary."));
    }

    const request = await models.nftRequests.update({
      requestStatus: status,
      adminNotes,
    }, {
      where: { id },
    });

    return res.status(200).json({
      request,
    });
  } catch (err) {
    logger.error(err);
    return next(new HttpError(422));
  }
};

exports.createNFTRequest = async (request, response, next) => {
  try {
    const {
      userId,
      username,
      landOwner,
      landArea,
      phyto,
      geolocation,
      userNotes,
      car,
      alertCode,
      basin,
      cpf
    } = request.body;

    await models.nftRequests.create({
      userId,
      username,
      landOwner,
      landArea,
      phyto,
      geolocation,
      userNotes,
      car,
      alertCode,
      basin,
      cpf,
      adminNotes: "",
      certificate: fs.readFileSync(
        __basedir + "/resources/static/assets/uploads/" + request.file.filename
      ),
    }).then((doc) => {
      fs.writeFileSync(__basedir + "/resources/static/assets/tmp/" + request.file.filename, 
      doc.certificate
      );
      return response.status(200).json(doc);
    })

  } catch (error) {
    logger.error(error);
    return next(new HttpError(500));
  }
}

//check new alerts from cars
//used by crontab
exports.checkCarsAlerts = async () => {
  const chaincodeName = "erc1155";
  const channel = "mychannel";
  const org = "Carbon";
  const username = "admin@admin.com";

  try{   
    //connect to the channel and get the chaincode
    const [chaincode, gateway] = await helper.getChaincode(org, channel, chaincodeName, username);
    if (!chaincode) return;
 
    //get receiver id
    const result = await chaincode.submitTransaction("SmartContract:GetAllNFTIds");
    if (!result) return;
    
    const nfts = JSON.parse(result.toString());
    logger.info(nfts);

    nfts.forEach(async nft => {

      const nftJson = JSON.parse(nft[1]);

      // const user = nftJson.metadata?.username;

      let mapBiomas = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql";
      let res = await axios.post(
        mapBiomas, 
        {
          query: `
            query {
              ruralProperty(
                propertyCode: "${nftJson.metadata?.car}"
              ) {
                alerts {
                  alertCode
                  detectedAt
                }
              }
            }
          `
        }, 
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const alerts_count = res.data?.data?.ruralProperty?.alerts?.length;
      const receiverAccountId = await helper.getAccountId(channel, chaincodeName, nftJson.metadata?.username, org);
      if (alerts_count > 0){
        const alertCode = res.data?.data?.ruralProperty?.alerts[0].alertCode;

        await chaincode.submitTransaction("SmartContract:SetNFTStatus", receiverAccountId, nft[0], 'Bloqueado');
        await chaincode.submitTransaction("SmartContract:SetNFTAlertCode", receiverAccountId, nft[0], alertCode);
      } else {
        await chaincode.submitTransaction("SmartContract:SetNFTStatus", receiverAccountId, nft[0], 'Ativo');
        await chaincode.submitTransaction("SmartContract:SetNFTAlertCode", receiverAccountId, nft[0], '');
      }
    });

    //close communication channel
    await gateway.disconnect();
  } catch (err) {
    logger.info("Erro no cron");
    /* const regexp = new RegExp(/message=(.*)$/g);
    const errMessage = regexp.exec(err.message);
    return next(new HttpError(500, err.message)); */
  }

  try {
    const requests = await models.nftRequests.findAll();
    console.log('requests', requests);
    if (requests && (requests.lengh > 0)) {
      requests.map(async (request) => {
        if (request.car) {
          let mapBiomas = "https://plataforma.alerta.mapbiomas.org/api/v2/graphql"

          let res = await fetch(mapBiomas, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: `
              query {
                ruralProperty (
                  propertyCode: "${request.car}"
                ){
                  alerts {
                    alertCode,
                    detectedAt
                  }
                }
              }`
            }),
          });

          res = await res.json();

          const alerts_count = res.data?.ruralProperty?.alerts?.length;
          const alertCode = res.data?.ruralProperty?.alerts[0].alertCode;

          if (alerts_count.length > 0) {
            await models.nftRequests.update({
              alertCode,
            }, {
              where: { id },
            });
          } else {
            await models.nftRequests.update({
              alertCode: '',
            }, {
              where: { id },
            });
          }
        }
      })
    }

    logger.info("Daily cronjob done! Search for new alerts complete");
  } catch (error) {
    return new HttpError(500, error);
  }
};

