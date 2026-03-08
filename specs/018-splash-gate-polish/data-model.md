# Data Model: Splash Gate Polish

**Branch**: `018-splash-gate-polish` | **Date**: 2026-03-08

## Overview

No new data entities are introduced. This feature modifies existing splash gate assets and code only.

## Modified Entities

### SPLASH_CONTENT (js/splash.js)

Existing constant. Signature removal reduces the content structure:

**Before**:
- heading: string (greeting text)
- body: string (description text)
- [signature image rendered separately via DOM]

**After**:
- heading: string (greeting text — unchanged)
- body: string (description text — unchanged)
- [signature image removed entirely]

### Asset Files

| Action | File | Notes |
|--------|------|-------|
| REPLACE | assets/chamber-door.png | New door, same 768x1152 dimensions |
| REPLACE | assets/chamber-door.webp | Regenerated from new door source |
| ADD | assets/wizard-desk.png | Optimized 768x512 desk scene |
| ADD | assets/wizard-desk.webp | WebP variant of desk |
| ADD | assets/quill-cursor.png | 48x48 cursor image |
| DELETE | assets/odd-wizard-signature.png | Orphaned by signature removal |
| DELETE | assets/odd-wizard-signature.webp | Orphaned by signature removal |

## No External Contracts

This feature has no external interfaces, APIs, or contracts. All changes are internal to the splash gate module (js/splash.js, css/styles.css, assets/).
