/**
 * TEE (Trusted Execution Environment) Module
 *
 * In production, this would interface with Intel SGX/TDX or ARM TrustZone
 * to perform cryptographic operations inside an isolated enclave.
 *
 * This module provides:
 *   - Enclave-isolated key derivation
 *   - Sealed storage (keys encrypted with enclave-specific seal key)
 *   - Remote attestation stubs
 *
 * In simulation mode (TEE_MODE=simulation), all operations run in the
 * Node.js process with equivalent cryptographic primitives but without
 * hardware isolation. Set TEE_MODE=sgx and TEE_ENCLAVE_URL for production.
 */

import crypto from 'crypto';

const TEE_MODE = process.env.TEE_MODE || 'simulation';
const SEAL_KEY = process.env.TEE_SEAL_KEY || crypto.randomBytes(32);

class EnclaveSimulator {
  constructor() {
    // Simulated enclave identity for attestation
    this.enclaveId = crypto.randomBytes(16).toString('hex');
    this.sealKey = typeof SEAL_KEY === 'string'
      ? Buffer.from(SEAL_KEY, 'hex')
      : SEAL_KEY;
    this.mrenclave = crypto.createHash('sha256')
      .update(`enclave-v1-${this.enclaveId}`)
      .digest('hex');
  }

  /**
   * Derive a key inside the enclave.
   * In real TEE: EGETKEY instruction on SGX, or KDF bound to enclave measurement
   */
  deriveKey(userId, purpose = 'master-key-encryption') {
    const hmac = crypto.createHmac('sha256', this.sealKey);
    hmac.update(`${userId}:${purpose}`);
    return hmac.digest();
  }

  /**
   * Seal data — encrypt with a key bound to the enclave identity.
   * In real TEE: Data is encrypted with a seal key only accessible to this enclave.
   */
  seal(plaintext) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.sealKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      sealed: Buffer.concat([iv, tag, encrypted]).toString('base64'),
      mrenclave: this.mrenclave,
    };
  }

  /**
   * Unseal data — decrypt with the enclave seal key.
   */
  unseal(sealedBase64) {
    const buf = Buffer.from(sealedBase64, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.sealKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  /**
   * Generate a remote attestation report.
   * In real TEE: This would produce an SGX Quote or TDX Report
   * that can be verified by Intel Attestation Service (IAS) or DCAP.
   */
  generateAttestation(userData = '') {
    const timestamp = Date.now();
    const reportData = crypto.createHash('sha256')
      .update(`${userData}:${timestamp}`)
      .digest('hex');

    return {
      mode: 'simulation',
      enclaveId: this.enclaveId,
      mrenclave: this.mrenclave,
      reportData,
      timestamp,
      signature: crypto.createHmac('sha256', this.sealKey)
        .update(reportData)
        .digest('hex'),
      warning: TEE_MODE === 'simulation'
        ? 'SIMULATION MODE — not hardware-attested. Use SGX/TDX in production.'
        : undefined,
    };
  }

  /**
   * Perform key wrapping inside the enclave.
   * Wraps a user's master key with an enclave-derived wrapping key.
   */
  wrapKey(masterKeyBuffer, userId) {
    const wrappingKey = this.deriveKey(userId, 'key-wrapping');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', wrappingKey, iv);
    const wrapped = Buffer.concat([cipher.update(masterKeyBuffer), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
      wrappedKey: Buffer.concat([iv, tag, wrapped]).toString('base64'),
      enclaveId: this.enclaveId,
    };
  }

  /**
   * Unwrap a key inside the enclave.
   */
  unwrapKey(wrappedBase64, userId) {
    const wrappingKey = this.deriveKey(userId, 'key-wrapping');
    const buf = Buffer.from(wrappedBase64, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', wrappingKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }
}

// Singleton
let enclaveInstance = null;

export function getEnclave() {
  if (!enclaveInstance) {
    if (TEE_MODE === 'simulation') {
      enclaveInstance = new EnclaveSimulator();
      console.log(`[TEE] Initialized in SIMULATION mode (enclave: ${enclaveInstance.enclaveId})`);
    } else {
      // In production, this would connect to a real SGX/TDX enclave service
      throw new Error(
        `TEE_MODE="${TEE_MODE}" is not yet implemented. ` +
        'Set TEE_MODE=simulation for development or provide TEE_ENCLAVE_URL for production.'
      );
    }
  }
  return enclaveInstance;
}

export { EnclaveSimulator };
