# estorage
EncryptedStorage provides an encryption enabled key-value data storage with REST API interface.

# TODOS
- [ ] Add OpenAPI specs.

# Usage
## Running the Service
* Install Docker and execute start script (`./start.sh`).
* Service will start listening at `:5090` on your host machine.

## Using the Service
### PUT /store
- PUT used since it creates or overwrites an item that associated with `id`.
#### Input Payload
```
{
  id: string;
  encryption_key: string;
  value: object;
}
```
#### Output Payload
```
{
  id: string;
  value: object;
}
```
#### Sample Usage
```
curl -X PUT http://localhost:5090/store -H "Content-Type: application/json" -d '{"id": "name-ilker", "encryption_key": "xxx", "value": "Istanbul"}'
```

### GET /retrive
- `id` can be a full id or a search pattern for id with wildcard support.
- An array of items will be returned from this endpoint and it's expected that all matching id's will be belong to corresponding owner (`dencryption_key`), otherwise an empty array will be returned.
#### Input Payload
```
{
  id: string;
  dencryption_key: string;
}
```
#### Output Payload
```
{
  id: string;
  value: object;
}
```
#### Sample Usage
```
curl -X GET http://localhost:5090/retrive -H "Content-Type: application/json" -d '{"id": "name-i*", "dencryption_key": "xxx"}'
```

## Testing the Service
- Install node, npm and run following commands afterwards:
```
npm install
npm run test
```

## Running the Service in Dev Mode
- Install node, npm.
- Install and start mongodb at its default address.
- Run following commands afterwards:
```
npm install
npm run dev
```
