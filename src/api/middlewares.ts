import { createValidationError, ResponseError } from "./error";

// errorMiddleware executes next handler while catching any error thrown during the process.
// if error is a ResponseError it directly creates a JSON error response by using it, if not,
// it constructs a ResponseError from that. finally it sends an errors response to client.
export async function errorMiddleware(ctx , next) {
  try {
    await next();
  }  catch (err) {
    if (err.name !== "ResponseError") {
      err = new ResponseError(500, err.message);
    }
    ctx.status = err.status;
    ctx.body = { error: err.toObject() };
  }
}

// withStorageValidation makes sure catching any validation errors thrown by the EncryptedStorage
// to convert it to ResponseError type which will be encoded in JSON later on to send it back as a response to client.
export async function withStorageValidation(ctx , next) {
    try {
      await next();
    } catch (err) {
      if (err.name === "EStorageIDValidationError") {
        throw createValidationError({ id: err.message });
      }
      throw err;
    }
  }

export default [
  errorMiddleware,
  withStorageValidation,
];
