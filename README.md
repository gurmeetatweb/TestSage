# TestSage

Field-aware regression intelligence for software applications.

An open-source QA Impact Intelligence platform that automatically discovers application flows, detects field-level changes, analyzes regression impact, and recommends what to test.

## Features

- Automatic screen discovery
- Snapshot comparison
- Field-level change detection
- Impact analysis
- Historical tracking
- Regression recommendations

## Architecture

Discovery
↓
Snapshots
↓
Field Changes
↓
Field Registry
↓
Impact Analysis

## Usage

node tools/runImpactPipeline.js
npx playwright test tests/discovery-client-management.spec.ts --headed