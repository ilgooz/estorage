#!/bin/bash

docker kill estorage || true
docker kill estorage-mongo || true

docker rm estorage || true
docker rm estorage-mongo || true

docker build -t estorage .

docker run -d --name estorage-mongo mongo
docker run --name estorage -ti -p 5090:80 --link estorage-mongo estorage \
  --host 0.0.0.0 \
  --port 80 \
  --mongo-addr mongodb://estorage-mongo:27017/estorage