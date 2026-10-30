import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

export type JSONEncodable = string | number | boolean | null | Record<string, unknown> | JSONEncodable[];

export class EJWT {
    static ALGO = 'aes-256-gcm' as const;

    protected prefix: string;
    protected data: JSONEncodable;
    protected aad: JSONEncodable;
    
    constructor(prefix: string, data: JSONEncodable, aad: JSONEncodable) {
        this.prefix = prefix;
        this.data = data;
        this.aad = aad;
    }

    async get_string(secret: string, nonce?: string): Promise<string> {
        const key = createHash('sha256').update(secret, 'utf8').digest();

        const iv = nonce ? createHash('md5').update(nonce).digest().subarray(0, 12) : randomBytes(12)

        const cipher = createCipheriv(EJWT.ALGO, key, iv);

        const aad = Buffer.from(JSON.stringify(this.aad), "utf8");
        const plaintext = Buffer.from(JSON.stringify(this.data), "utf8");

        const authenticatedData = Buffer.from(
            `${this.prefix}.${aad.toString('base64url')}`
        );
        cipher.setAAD(authenticatedData);

        const cipherText = Buffer.concat([
            cipher.update(plaintext),
            cipher.final()
        ]);

        const tag = cipher.getAuthTag();

        return `EJWT::${this.prefix}::${iv.toString('base64url')}::${cipherText.toString('base64url')}::${tag.toString('base64url')}::${aad.toString('base64url')}`;
    }

    static async load(token: string, secret: string): Promise<EJWT> {
        const parts = token.split('::');
        if (parts[0] !== 'EJWT' || parts.length !== 6) {
            throw new Error("Attempted to load an EJWT token, that isn't an EJWT token.");
        }

        const [ejwt_p, prefix, ivB64, encryptedB64, tagB64, aadB64] = parts;

        if (!prefix || !aadB64 || !ivB64 || !encryptedB64 || !tagB64) {
            throw new Error('Invalid EJWT components');
        }

        const key = createHash('sha256').update(secret, 'utf8').digest();

        const iv = Buffer.from(ivB64, 'base64url');
        const ciphertext = Buffer.from(encryptedB64, 'base64url');
        const tag = Buffer.from(tagB64, 'base64url');

        if (iv.length !== 12 || tag.length !== 16) {
            throw new Error('Invalid IV or authentication tag');
        }

        const decipher = createDecipheriv(EJWT.ALGO, key, iv);
        decipher.setAAD(Buffer.from(`${prefix}.${aadB64}`, 'utf8'));

        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([
            decipher.update(ciphertext),
            decipher.final()
        ]);

        const data = JSON.parse(decrypted.toString('utf8'));
        const aad = JSON.parse(
            Buffer.from(aadB64, 'base64url').toString('utf8')
        );

        return new EJWT(prefix, data, aad);
    }

    getData(): JSONEncodable {
        return this.data;
    }

    getAAD(): JSONEncodable {
        return this.aad;
    }

    getPrefix(): string {
        return this.prefix;
    }
}