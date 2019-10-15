import Joi from "joi";

// ResponseError is a special error type to response http requests with error.
// sample format in an http response:
//  400 {
//     "error": {
//       "message": "x-message",
//       "fields": {
//           "username": "x-details",
//           "age": "y-details"
//       }
//   }
// }
export class ResponseError implements Error {
  public name: string = "ResponseError";
  public status: number;
  public message: string;
  public error: {
    message: string;
    fields?: IFieldsValidation;
  };

  constructor(status: number, message: string, fields?: IFieldsValidation) {
    this.status = status;
    this.message = message;
    this.error = { message };
    if (fields) {
      this.error.fields = fields;
    }
  }

  public toObject() {
    return this.error;
  }
}

export interface IFieldsValidation {
  [key: string]: string;
}

// createValidationError creates a new ResponseError for invalid http request payload.
export function createValidationError(fields: IFieldsValidation): ResponseError {
  return new ResponseError(400, "invalid inputs", fields);
}

// validate validates data (usually request.body) by using validation rules.
export function validate(validator: Joi, data: object): IFieldsValidation {
  const { error } = Joi.validate(data, validator);
  if (!error) {
    return { };
  }
  const validation = {};
  error.details.forEach((e) => validation[e.path[0]] =  e.message);
  return validation;
}
