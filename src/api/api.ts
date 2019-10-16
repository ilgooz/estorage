import http, { Server } from "http";
import Joi from "joi";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { AddressInfo } from "net";
import util from "util";

import EncryptedStorage from "../estorage";
import { createValidationError, validate } from "./error";
import middlewares from "./middlewares";

export interface IAddr {
  host?: string;
  port?: number;
}

// API is a RESTful API to expose EncryptedStorage's features to network.
export default class API {
  public addr: AddressInfo;
  public server: Server;

  private addrOption: IAddr;
  private estorage: EncryptedStorage;

  private storeValidation: Joi = Joi.object().keys({
    encryption_key: Joi.string().required(),
    id: Joi.string().required(),
    value: Joi.required(),
  });

  private retriveValidation: Joi = Joi.object().keys({
    dencryption_key: Joi.string().required(),
    id: Joi.string().required(),
  });

  constructor(estorage: EncryptedStorage, addr: IAddr = { host: "localhost", port: 0 } ) {
    this.estorage = estorage;
    this.addrOption = addr;
    this.setup();
  }

  // listen starts the HTTP server in specified configs.
  public async listen(): Promise<Server> {
    const promised = util.promisify(this.server.listen.bind(this.server));
    await promised(this.addrOption.port, this.addrOption.host);
    this.addr = this.server.address() as AddressInfo;
    return this.server;
  }

  // setup setups the routes, middlewares, the HTTP server, etc.
  private setup() {
    const router = new Router();
    router.put("/store", this.storeHandler.bind(this));
    router.get("/retrive", this.retriveHandler.bind(this));

    const app = new Koa();
    app.use(bodyParser());
    middlewares.map((m) => app.use(m.bind(this)));
    app.use(router.routes());
    app.use(router.allowedMethods());

    this.server = http.createServer(app.callback());
  }

  // storeHandler stores value.
  private async storeHandler(ctx) {
    const { id, encryption_key, value } = ctx.request.body;
    this.requireValidation(ctx, this.storeValidation);
    await this.estorage.save(id, encryption_key, value);
    ctx.body = { id, value };
  }

  // retriveHandler retrives and decodes an encrypted value.
  private async retriveHandler(ctx) {
    const { id, dencryption_key } = ctx.request.body;
    this.requireValidation(ctx, this.retriveValidation);
    ctx.body = await this.estorage.find(id, dencryption_key);
  }

  // requireValidation make sure that request payload is valid.
  private requireValidation(ctx, validator) {
    const validationError = validate(validator, ctx.request.body);
    if (Object.keys(validationError).length) {
      throw createValidationError(validationError);
    }
  }
}
