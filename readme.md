# URI HMAC Signer
A module for signing and validating URIs using HMAC.

## Installation
`npm i uri-hmac-sign`

## Usage

    const createSigner = require('uri-hmac-sign');
    const signer = createSigner({
        key: 'Your signing key goes here',
        algorithm: 'The algorithm to use with the HMAC',
        // Whether to order the querystring parameters (A function will be used as the sort argument),
        order: true,
        // The name of the querystring value that should be used to store the hash in the URI
        querystringName: 'hash' // Defaults to hash
    });

    let signed = signer.sign('http://your.abso/ute.uri/here');
    signer.validate(signed);

    signed = signer.sign('/relative/uris/work/well/too');
    signer.validate(signed);

