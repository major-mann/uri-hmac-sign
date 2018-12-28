const mockery = require('mockery');

const chai = require('chai'),
    spies = require('chai-spies');

const KEY = Symbol('key'),
    URI = `http://example.com/foo?bar=baz&abc=123`,
    RELATIVE_URI = `/foo?bar=baz&abc=123`,
    URI_CANONICAL = `http://example.com:80/foo?abc=123&bar=baz`,
    RELATIVE_URI_CANONICAL = `/foo?abc=123&bar=baz`,
    URI_HASH = 'f92ef8a1',
    URI_SIGNED = `http://example.com/foo?bar=baz&abc=123&hash=${URI_HASH}`,
    URI_SIGNED_INVALID = `http://example.com/foo?bar=baz&abc=123&hash=tamper`,
    RELATIVE_URI_SIGNED = `/foo?bar=baz&abc=123&hash=${URI_HASH}`,
    RELATIVE_URI_SIGNED_INVALID = `/foo?bar=baz&abc=123&hash=tamper`,
    ALGORITHM = Symbol('algorithm');

chai.use(spies);

const { expect, spy } = chai;
let crypto, hmac;

beforeEach(function () {
    mockery.enable({
        useCleanCache: true,
        warnOnUnregistered: false,
        warnOnReplace: true
    });

    hmac = {
        update: spy(),
        digest: spy(() => URI_HASH)
    };
    crypto = {
        createHmac: function (algorithm, key) {
            expect(algorithm).to.equal(ALGORITHM);
            expect(key).to.equal(KEY);
            return hmac;
        }
    };

    mockery.registerMock('crypto', crypto);
    mod = require('./index.js');
});

afterEach(function () {
    mockery.deregisterAll();
    mockery.disable();
});

describe('factory', function () {
    it('should be a function', function () {
        expect(mod).to.be.a('function');
    });

    describe('instance', function () {
        let sign, validate;
        beforeEach(function () {
            const instance = mod({ algorithm: ALGORITHM, key: KEY });
            sign = instance.sign;
            validate = instance.validate;
        });

        describe('sign', function () {
            it('should be a function', function () {
                expect(sign).to.be.a('function');
            });
            it('should encode the HMAC with hex', function () {
                hmac.digest = spy(function digest(encoding) {
                    expect(encoding).to.equal('hex');
                    return URI_HASH;
                });
                hmac.update = spy(function (val) {
                    console.log(val);
                })
                sign(URI);
                expect(hmac.update).to.have.been.called.once.with(URI_CANONICAL);
                expect(hmac.digest).to.have.been.called.once.with('hex');
            });
            it('should sign absolute URIs', function () {
                const result = sign(URI);
                expect(result).to.equal(URI_SIGNED);
            });
            it('should sign relative URIs', function () {
                const result = sign(RELATIVE_URI);
                expect(hmac.update).to.have.been.called.once.with(RELATIVE_URI_CANONICAL);
                expect(result).to.equal(RELATIVE_URI_SIGNED);
            });
            it('should not order the querystring values lexically if options.order is false', function () {
                instance = mod({ algorithm: ALGORITHM, key: KEY, order: false });
                instance.sign(RELATIVE_URI);
                expect(hmac.update).to.have.been.called.once.with(RELATIVE_URI);
            });
            it('should use options.order as the sort function if it is a function', function () {
                instance = mod({ algorithm: ALGORITHM, key: KEY, order });
                instance.sign(RELATIVE_URI);
                expect(hmac.update).to.have.been.called.once.with(RELATIVE_URI);

                function order(a, b) {
                    if (a < b) {
                        return 1;
                    } else if (a === b) {
                        return 0;
                    } else {
                        return -1;
                    }
                }
            });
        });

        describe('validate', function () {
            it('should be a function', function () {
                expect(validate).to.be.a('function');
            });
            it('should validate absolutely signed URIs', function () {
                expect(validate(URI_SIGNED)).to.equal(true);
            });
            it('should validate relatively signed URIs that are supplied in an absolute form', function () {
                expect(validate(RELATIVE_URI_SIGNED)).to.equal(true);
            });
            it('should not validate invalid absolutely signed URIs', function () {
                expect(validate(URI_SIGNED_INVALID)).to.equal(true);
            });
        });
    });
});
