# Finme License API

REST API for creating and managing licenses, validating license codes, and recording the computers that activate them.

## Setup

1. Install Node.js 18+ and run MongoDB locally, or provide a hosted MongoDB connection string.
2. Copy `.env.example` to `.env` and set `MONGO_URI`.
3. Run `npm install`.
4. Start the API with `npm run dev` or `npm start`.

The default server URL is `http://localhost:3000`.

## Endpoints

### License CRUD

- `POST /api/licenses` creates a license. Required: `name`. Optional: `code`, `status`, `expiresAt`, `maxActivations`.
- `GET /api/licenses` lists licenses without exposing code hashes.
- `GET /api/licenses/:id` gets one license.
- `PATCH /api/licenses/:id` updates any supplied license fields, including `code`.
- `DELETE /api/licenses/:id` deletes a license.

Example create request:

```json
{
  "name": "Finme Pro",
  "code": "FINME-PRO-001",
  "expiresAt": "2027-12-31T23:59:59.000Z",
  "maxActivations": 2
}
```

The create response includes the plain license code once. Codes are stored as SHA-256 hashes.

### Activation

`POST /api/licenses/activate`

```json
{
  "code": "FINME-PRO-001",
  "computerId": "device-unique-id",
  "computerName": "DESKTOP-01"
}
```

The API records `computerId`, computer name, IP address, user agent, and activation time. Repeating activation from the same computer is idempotent; a different computer is rejected after `maxActivations` is reached.
