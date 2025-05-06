//Errors dictionary + interface to create errors (HttpError)
const logger = require("./logger");

class ErrorMessage {
  constructor(messagePT) {
    this.messagePT = messagePT;
  }
}

const notFound = new ErrorMessage("Content not found");
const serverError = new ErrorMessage("Error. Please, try again");
const unauthorized = new ErrorMessage(
  "Wrong authentication. Please, try again"
);
const forbidden = new ErrorMessage("Not authorized");
const validationError = new ErrorMessage("Invalid data. Please, check it");
const conflict = new ErrorMessage('User already registered".');

const codes = {
  401: unauthorized,
  403: forbidden,
  404: notFound,
  409: conflict,
  422: validationError,
  500: serverError,
};

//Error Factory
class HttpError extends Error {
  constructor(code, message = null) {
    //add message property (Error constructor)
    message === null ? super(codes[code].messagePT) : super(message);
    // console.log("oi", codes[code].messagePT);

    //add code property
    this.code = code;

    logger.error(code, message === null ? codes[code].messagePT : message);
  }
}

exports.getErrorMessage = (field) => {
  var response = {
    success: false,
    message: field + " field is missing or Invalid in the request",
  };
  return response;
};

module.exports = HttpError;
