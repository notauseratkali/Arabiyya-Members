# Security Policy

## Supported versions

Security fixes are applied to the code on the default branch of this repository (Arabiyya Members). There are no separately numbered release lines.

## Reporting a vulnerability

Please report security issues privately. Do not open a public GitHub issue for a suspected vulnerability.

1. Open a [private security advisory](https://github.com/notauseratkali/Arabiyya-Members/security/advisories/new) on this repository.
2. Include what you found, how to reproduce it, and the impact you expect.
3. The maintainer will reply on that advisory. There is no fixed response window.

If you cannot use GitHub advisories, you can also write to the council address already published in the app: it@arabiyyascouts.org. Do not include live member passwords or exported personal data in the email.

## What this app stores

Member records, password hashes, one-time codes, and server settings are meant to be reachable only through the API process (Firebase Admin SDK). Browser clients must not be able to read `otps`, `member_applications`, `settings`, or password fields. See `firestore.rules` and `README.md` for the deploy steps that make that true in production.
