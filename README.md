# BCrypto (Better Crypto)

## Install

### With NPM

```bash
npm install @commonts/bcrypto
```

### With Bun

```bash
bun i @commonts/bcrypto
```

## Features

### EJWT (Encrypted JWT)

EJWT is a JWT tokens that encrypts its sensitive data, and can attach extra AAD (Additional Authenticated Data).

Constructing an EJWT token requires:

* `prefix: string` &mdash; a prefix for the token, to identify your application
* `data: JSONEncodable` &mdash; JSON-encodable data to encode in the token
* `aad: JSONEncodable` &mdash; any additional AAD to pass to the encryption function
* `secret: string` &mdash; a secret, of any length
* `nonce?: string` &mdash; a random string, optional

The format will consist of 6 elements:

```sh
<a>::<b>::<c>::<d>::<e>::<f>
```

They represent as follows:

* `a` &mdash; will always be `EJWT`. Simply exists to identify that this is an EJWT token
* `b` &mdash; user-chosen prefix, part of AAD
* `c` &mdash; an IV, derived from the nonce
* `d` &mdash; the encrypted ciphertext; encrypted with `AES-256-GCM`
* `e` &mdash; an authentication tag, resulting from encryption with `AES-256-GCM`, to ensure that the data wasn't tampered with
* `f` &mdash; all AAD; includes the user-chosen prefix, as well as the aad passed by the user

An example EJWT is:

```sh
EJWT::Example::4QrcOUm6Wau-VuBX::4C1-OBsXEnoamZzH67q0::mogGPgT7i9Yo4KH-sfsofQ::e30
```

The code for the example above is:

```ts
const ejwt = new EJWT("Example", {
    mydata: 2023
}, {});

const token = await ejwt.get_string("mySecret", "123456")  // note: make the nonce random in production code, or don't specify it
```
