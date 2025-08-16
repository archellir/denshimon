import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, AlertCircle, Globe, Shield } from 'lucide-react';
import { CertificateStatus } from '@/types/certificates';

/**
 * Gets the CSS color classes for certificate status
 */
export const getCertificateStatusColor = (status: CertificateStatus): string => {
  switch (status) {
    case CertificateStatus.VALID:
      return 'border-green-400 text-green-400';
    case CertificateStatus.EXPIRING_SOON:
      return 'border-yellow-400 text-yellow-400';
    case CertificateStatus.EXPIRING_CRITICAL:
      return 'border-red-400 text-red-400';
    case CertificateStatus.EXPIRED:
      return 'border-red-600 text-red-600';
    case CertificateStatus.INVALID:
      return 'border-purple-400 text-purple-400';
    case CertificateStatus.UNREACHABLE:
      return 'border-gray-400 text-gray-400';
    default:
      return 'border-white';
  }
};

/**
 * Gets the appropriate icon for certificate status
 */
export const getCertificateStatusIcon = (status: CertificateStatus): React.ReactElement => {
  switch (status) {
    case CertificateStatus.VALID:
      return React.createElement(CheckCircle, { size: 16, className: "text-green-400" });
    case CertificateStatus.EXPIRING_SOON:
      return React.createElement(Clock, { size: 16, className: "text-yellow-400" });
    case CertificateStatus.EXPIRING_CRITICAL:
      return React.createElement(AlertTriangle, { size: 16, className: "text-red-400" });
    case CertificateStatus.EXPIRED:
      return React.createElement(XCircle, { size: 16, className: "text-red-600" });
    case CertificateStatus.INVALID:
      return React.createElement(AlertCircle, { size: 16, className: "text-purple-400" });
    case CertificateStatus.UNREACHABLE:
      return React.createElement(Globe, { size: 16, className: "text-gray-400" });
    default:
      return React.createElement(Shield, { size: 16 });
  }
};

/**
 * Formats a date string for certificate display
 */
export const formatCertificateDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Calculates days until certificate expiration
 */
export const getDaysUntilExpiration = (expiryDate: string): number => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffInMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
};

/**
 * Gets certificate status based on expiry date
 */
export const getCertificateStatusFromExpiry = (expiryDate: string): CertificateStatus => {
  const daysUntilExpiry = getDaysUntilExpiration(expiryDate);
  
  if (daysUntilExpiry < 0) {
    return CertificateStatus.EXPIRED;
  } else if (daysUntilExpiry <= 7) {
    return CertificateStatus.EXPIRING_CRITICAL;
  } else if (daysUntilExpiry <= 30) {
    return CertificateStatus.EXPIRING_SOON;
  } else {
    return CertificateStatus.VALID;
  }
};