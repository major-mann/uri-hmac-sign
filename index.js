module.exports = createHmacSigner;

const { URL: Url } = require('url');
const crypto = require('crypto');
const portNumbers = require('port-numbers');

const FAKE = '027ae0f7-3baf-4c26-a5f7-dcd57cadeffe',
    FAKE_FULL = `http://${FAKE}`,
    FAKE_FULL_LENGTH = FAKE_FULL.length;

const OPTIONS = {
    order: true,
    algorithm: 'md5',
    querystringName: 'hash'
};

/**
 * Create a new HMAC signer and validator
 * @param options The general options to use with the signer
 * @param options.key The key to sign or validate with
 * @param options.order Whether to order the querystring parameters. If this is false, the value will simply be appended
 *                      to the search. if this is a function it will be supplied to the sort function. If this is true
 *                      the values will be ordered lexographically according to the system configuration. Defaults to true
 * @param options.algorithm The algorithm to sign with. Defaults to 'md5'
 * @param options.querystringName The name of the querystring parameter to append (defaults to 'hash')
 */
function createHmacSigner(options) {
    options = Object.assign({}, OPTIONS, options);
    if (!options || !options.key) {
        throw new Error('A signing key (options.key) is required');
    }

    return {
        sign,
        validate
    };

    /**
     * Signs the supplied URI.
     * @param uri The URI to sign. This can be absolute or relative.
     */
    function sign(uri) {
        uri = new Url(uri, FAKE_FULL);
        const signingString = buildSigningString(uri);
        const signature = generateSignature(options.algorithm, options.key, signingString);

        uri.searchParams.set(options.querystringName, signature);

        let result = uri.toString();
        if (!isAbsolute(uri)) {
            result = result.substr(FAKE_FULL_LENGTH);
        }
        return result;
    }

    /**
     * Validates the supplied URI signing
     * @param uri The URI to validate
     */
    function validate(uri) {
        uri = new Url(uri, FAKE_FULL);
        const hash = uri.searchParams.get(options.querystringName);
        if (!hash) {
            return false;
        }

        // Remove the hash to generate the original
        uri.searchParams.delete(options.querystringName);

        const signingString = buildSigningString(uri);
        const signature = generateSignature(options.algorithm, options.key, signingString);

        return signature === hash;
    }

    function generateSignature(algorithm, key, value) {
        const hmac = crypto.createHmac(algorithm, key);
        hmac.update(value);
        const signature = hmac.digest('hex');
        return signature;
    }

    function buildSigningString(uri) {
        const parts = [];
        if (isAbsolute(uri)) {
            parts.push(`${uri.protocol}//`);
            parts.push(uri.hostname);
            parts.push(':');
            if (uri.port > 0) {
                parts.push(uri.port);
            } else {
                const protocol = uri.protocol.substr(0, uri.protocol.length - 1);
                const portNumber = portNumbers.getPort(protocol);
                parts.push(portNumber.port);
            }
        }
        parts.push(uri.pathname);
        const qs = createQs();
        if (qs) {
            parts.push(qs);
        }
        const signingString = parts.join('');
        return signingString;

        function createQs() {
            if (!uri.search) {
                return undefined;
            }
            if (options.order) {
                const sortHandler = typeof options.order === 'function' ?
                    options.order :
                    undefined;
                const qsItems = Array.from(uri.searchParams.keys())
                    .sort(sortHandler)
                    .map(createQsPart);
                return `?${qsItems.join('&')}`;
            } else {
                return uri.search;
            }
        }

        function createQsPart(key) {
            return `${encodeURIComponent(key)}=${encodeURIComponent(uri.searchParams.get(key))}`;
        }
    }

    function isAbsolute(uri) {
        return uri.hostname !== FAKE;
    }
}
