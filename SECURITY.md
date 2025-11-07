# Security Policy

## Reporting a Vulnerability

The Docker Registry UI team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security vulnerabilities by emailing:

**kactica.pro@gmail.com**

### What to Include

Please include the following information in your report:

1. **Description** - A clear description of the vulnerability
2. **Impact** - What an attacker can achieve by exploiting this vulnerability
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Proof of Concept** - If possible, include a PoC or example exploit
5. **Environment** - Version affected, configuration details
6. **Suggested Fix** - If you have ideas on how to fix it (optional)

### Response Timeline

- **Within 24 hours** - We will acknowledge receipt of your report
- **Within 7 days** - We will provide an initial assessment of the vulnerability
- **Within 30 days** - We aim to release a patch or mitigation strategy

### Disclosure Policy

- **Coordinated Disclosure** - Please give us reasonable time to fix the issue before public disclosure
- **Credit** - We will credit you in our security advisory (unless you prefer to remain anonymous)
- **Communication** - We will keep you informed of our progress

## Security Best Practices

### Deployment Security

1. **Reverse Proxy Authentication** (CRITICAL)
   - ALWAYS deploy behind a reverse proxy with authentication
   - Use Basic Auth, OAuth, or OIDC
   - Never expose the application directly to the internet
   - Example configurations in [README.md](README.md)

2. **Network Isolation**
   - Bind application to `127.0.0.1` in production (enforced by environment validation)
   - Use Docker networks or firewall rules to restrict access
   - Only expose reverse proxy to the internet

3. **TLS/SSL Configuration**
   - Use HTTPS for all connections
   - Keep certificates up to date

4. **Credentials Management**
   - Never commit `.env` files to version control
   - Use strong, unique passwords for Docker Registry
   - Rotate credentials regularly
   - Consider using secrets management (Vault, AWS Secrets Manager)

5. **Docker Registry Security**
   - Enable authentication on your Docker Registry
   - Use TLS for registry communication
   - Set `REGISTRY_STORAGE_DELETE_ENABLED` only if deletion is required
   - Regular security updates for Docker Registry

### Application Security

1. **Environment Variables**
   - All environment variables are validated on startup using Zod schemas
   - Production deployments enforce security requirements:
     - `HOST` must be `127.0.0.1`
   - See `.env.example` for complete configuration

2. **Input Validation**
   - Repository names validated against Docker naming conventions
   - Tag names validated for security
   - Digest format strictly validated
   - All API inputs sanitized to prevent injection attacks

3. **Token Management**
   - Bearer tokens cached server-side only
   - Tokens never exposed to frontend
   - Automatic token refresh before expiration
   - Configurable cache TTL (60-3600 seconds)

4. **Code Quality**
   - ESLint with security plugin (`eslint-plugin-security`)
   - Secret detection (`eslint-plugin-no-secrets`)
   - TypeScript strict mode with additional checks
   - Pre-commit hooks enforce all quality checks

### Monitoring and Logging

1. **User Activity Logging**
   - Enable `ENABLE_USER_LOGGING=true` to log user actions
   - User identity from `X-Forwarded-User` header (set by reverse proxy)
   - All destructive operations should be logged

2. **Security Events**
   - Monitor failed authentication attempts
   - Alert on unusual deletion patterns
   - Track API errors and rate limiting

3. **Regular Audits**
   - Review access logs regularly
   - Check for dependency vulnerabilities (`bun audit`)
   - Update dependencies with security patches

## Known Security Considerations

### External Authentication Dependency

This application **intentionally** has no built-in authentication. It relies entirely on external reverse proxy authentication. This is a security feature, not a bug.

**Why?**

- Authentication is handled by battle-tested reverse proxies (Nginx, Caddy, Traefik)
- Supports multiple authentication methods (Basic Auth, OAuth, OIDC, mTLS)
- Centralized authentication management
- Follows principle of least privilege

**Important:**

- Application MUST be bound to `127.0.0.1` in production
- Reverse proxy MUST enforce authentication
- Test your authentication setup thoroughly

### Docker Registry Permissions

Users authenticated via reverse proxy have full access to Docker Registry operations through this UI. Ensure:

1. Only trusted users have access
2. Docker Registry credentials are not overly permissive
3. Regular audits of user activity
4. Consider read-only mode for most users (disable delete operations)

### Data Privacy

This application is **stateless** and does not store user data. However:

1. **Logs** may contain:
   - User identifiers (from `X-Forwarded-User`)
   - Repository names accessed
   - Operations performed
   - Timestamps

2. **Token Cache** (server memory only):
   - Docker Registry bearer tokens
   - Cleared on application restart
   - Not persisted to disk

3. **Browser Storage**:
   - Dark mode preference (localStorage)
   - Language preference (cookie)
   - No sensitive data stored

## Security Updates

We will announce security updates through:

1. **GitHub Security Advisories** - Primary notification channel
2. **CHANGELOG.md** - All security fixes documented
3. **Release Notes** - Detailed information on patches

Subscribe to **GitHub Security Advisories** to receive notifications:

1. Go to the repository
2. Click "Watch" → "Custom" → "Security alerts"

## Dependencies

We regularly update dependencies to address security vulnerabilities:

```bash
# Check for vulnerabilities
bun audit

# Update dependencies
bun update
```

Dependencies are locked using `bun.lock` to ensure reproducible builds.

## Additional Resources

- [Docker Registry Image & Docs](https://hub.docker.com/_/registry)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

## Contact

For security-related questions or concerns:

- **Email:** kactica.pro@gmail.com

---

Thank you for helping keep Docker Registry UI and its users safe!
