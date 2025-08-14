export interface Certificate {
  id: string;
  domain: string;
  service: string;
  issuer: string;
  serialNumber: string;
  subject: string;
  notBefore: string;
  notAfter: string;
  daysUntilExpiry: number;
  status: CertificateStatus;
  algorithm: string;
  keySize: number;
  fingerprint: string;
  chain: CertificateChainInfo[];
  lastChecked: string;
}

export interface CertificateChainInfo {
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serialNumber: string;
}

export enum CertificateStatus {
  VALID = 'valid',
  EXPIRING_SOON = 'expiring_soon', // < 30 days
  EXPIRING_CRITICAL = 'expiring_critical', // < 7 days  
  EXPIRED = 'expired',
  INVALID = 'invalid',
  UNREACHABLE = 'unreachable'
}

export interface CertificateCheck {
  domain: string;
  timestamp: string;
  success: boolean;
  errorMessage?: string;
  certificate?: Certificate;
}

export interface CertificateAlert {
  id: string;
  domain: string;
  type: 'expiration' | 'invalid' | 'unreachable';
  severity: 'warning' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface CertificateStats {
  total: number;
  valid: number;
  expiringSoon: number;
  expiringCritical: number;
  expired: number;
  invalid: number;
  unreachable: number;
}

export interface DomainConfig {
  domain: string;
  service: string;
  port: number;
  enabled: boolean;
  checkInterval: number; // minutes
  lastCheck?: string;
}