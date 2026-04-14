# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within Genesis AI, please follow these steps:

### For Critical Vulnerabilities (Smart Contracts)

⚠️ **Smart contract vulnerabilities are time-critical!**

1. **DO NOT** create a public GitHub issue
2. Email us directly at: security@genesis-ai.example.com
3. Include in your report:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested fix (if any)

4. We will respond within **48 hours** with:
   - Acknowledgment of the report
   - Expected timeline for fix
   - Credit for the discovery (unless anonymity is requested)

5. After the fix is deployed, you will be credited in our security hall of fame

### For Non-Critical Issues

1. Create a private vulnerability report via GitHub Security Advisories
2. Or email: security@genesis-ai.example.com

### Scope

In-scope:
- Smart contract vulnerabilities
- Backend API security issues
- Frontend XSS/Injection vulnerabilities
- Authentication/Authorization bypasses
- Data exposure issues

Out of scope:
- Social engineering attacks
- Physical security
- Denial of Service attacks on test infrastructure
- Features outside the core platform

## Security Best Practices

When developing for this project:

1. **Smart Contracts**
   - Follow Solidity best practices
   - Use battle-tested libraries (OpenZeppelin)
   - Complete 100% test coverage for critical paths
   - Consider upgrade patterns carefully

2. **API**
   - Validate all inputs
   - Use parameterized queries
   - Implement rate limiting
   - Log security events

3. **Frontend**
   - Sanitize user inputs
   - Use HTTPS only
   - Implement CSP headers

## Security Updates

Security updates will be released as:
- Hotfixes for critical issues
- Regular version bumps for minor improvements

Follow this repository to receive security notifications.
