# Dependency Security Review

Date: 2026-09-10
Scope: `mobile/` dependency tree after the Slice 0 remediation.

## Baseline

- Expo: `52.0.49`
- Expo Router: `4.0.22`
- Expo Asset: `11.0.5`
- React Native: `0.76.9`
- Node baseline used by CI: 20
- npm override: `tar: 7.5.22`

The baseline is internally compatible and Expo startup, TypeScript, ESLint, and Jest tests pass. No broad Expo or React Native upgrade was performed.

## Audit Results

Commands:

```text
cd mobile && npm audit --json
cd mobile && npm audit --omit=dev --json
```

Results:

- Full tree: 31 findings, 0 critical, 8 high, 23 moderate.
- Production-scope audit: 30 findings, 0 critical, 8 high, 22 moderate.
- The production-scope count includes packages reachable from direct Expo/React Native dependencies, but the affected packages are CLI, Metro, parser, or build tooling and are not included as application runtime code in the shipped native bundle.
- The critical `tar` finding from the previous review was removed by the pinned `tar@7.5.22` override. No `--force` or audit suppression was used.

## High Findings

| Package | Installed | Dependency path | Direct? | Patched target | Runtime assessment | Disposition |
| --- | --- | --- | --- | --- | --- | --- |
| `@react-native/community-cli-plugin` | `0.76.9` | `react-native -> @react-native/community-cli-plugin -> metro/metro-config` | No | React Native `0.86.3` | React Native CLI/Metro tooling; not shipped in the native app bundle | C: accept temporarily |
| `@xmldom/xmldom` | `0.7.13` | `expo -> @expo/cli -> @expo/plist -> @xmldom/xmldom` | No | `@xmldom/xmldom` `0.9.12` is current | XML serialization/parser used by Expo CLI tooling; no Dharma runtime XML input path | C: accept temporarily |
| `image-size` | `1.2.1` | `react-native -> community CLI -> metro -> image-size` | No | React Native `0.86.3` updates the Metro chain | Image parsing in Metro development/build tooling; not application runtime | C: accept temporarily |
| `metro` | `0.81.5` | `react-native -> community CLI -> metro` | No | React Native `0.86.3` | JavaScript bundler tooling; not shipped in the native bundle | C: accept temporarily |
| `metro-config` | `0.81.5` | `react-native -> community CLI -> metro-config` | No | React Native `0.86.3` | Bundler configuration tooling; not application runtime | C: accept temporarily |
| `metro-transform-worker` | `0.81.5` | `react-native -> community CLI -> metro -> metro-transform-worker` | No | React Native `0.86.3` | Bundler transform tooling; not application runtime | C: accept temporarily |
| `postcss` | `8.4.49` | `expo -> @expo/metro-config -> postcss` | No | Expo `57.0.21` brings a newer compatible toolchain | Build-time CSS/source-map processing; Dharma does not process attacker-supplied CSS in the app | C: accept temporarily |
| `react-native` | `0.76.9` | Direct dependency; advisory is through its community CLI/Metro dependency | Yes | `0.86.3` | The flagged path is the CLI/Metro toolchain, not the native runtime code path identified by npm | C: accept temporarily |

### Advisory details

- `@react-native/community-cli-plugin`, `metro`, `metro-config`, `metro-transform-worker`, and `image-size` are reported through the Metro chain. npm's available fix is a major React Native upgrade to `0.86.3`.
- `postcss` advisories cover XSS and source-map file disclosure/path traversal conditions. npm's available fix is a major Expo upgrade to `57.0.21`.
- `@xmldom/xmldom` advisories cover XML injection, malformed-input denial of service, and serialization/parser issues. npm reports a safe transitive fix; the current path is Expo CLI tooling.
- `tar` was previously critical through `@expo/cli`/`cacache`; the repository override resolves it to `7.5.22`, and the current audit reports zero critical findings.

## Classification

### A. Must fix before Slice 1

None of the remaining high findings is an identified Dharma production-runtime path, and no critical finding remains. The `tar` critical finding is fixed. The dependency maintenance item below is still mandatory before production hardening.

### B. Fix before production

All eight high findings must be removed before production release or before a production build pipeline accepts untrusted source/assets. The target is a coordinated Expo/React Native upgrade, followed by a clean lockfile regeneration, mobile smoke tests, native build validation, and a fresh audit.

### C. Accept temporarily with documented rationale

For Slice 0 and the start of Slice 1, accept the eight high findings temporarily because they are transitive Expo/Metro/CLI/parser dependencies, the app does not process untrusted source maps/XML/CSS/images at runtime, and the safe fixes require a coordinated major baseline move. CI must continue to run the critical audit gate, and the high findings must remain visible in review output.

## Compatibility Decision

Do not upgrade Expo 52/RN 0.76 during this review. The available fixes move to React Native `0.86.3` and Expo `57.0.21`, which are major version changes and require a compatibility review of Expo modules, Expo Router, native projects, Jest, and the supported Node version. A targeted `tar` override was safe and already applied; a broad override for Metro, PostCSS, or XML packages would be riskier and was not used.

## Dependency Maintenance Item

**DM-001: Upgrade Expo/RN toolchain and clear high audit findings before production.**

1. Create a dependency-upgrade branch.
2. Upgrade Expo as a coordinated SDK change, using the Expo-recommended React Native version rather than independently forcing React Native `0.86.3`.
3. Regenerate the lockfile with `npm ci` verification.
4. Run Expo startup, native build checks, TypeScript, ESLint, Jest, and full/production audits.
5. Remove the `tar` override if the upgraded Expo CLI supplies a patched version.
6. Record advisory closure and compatibility results before production approval.

## Decision

**PASS WITH ACCEPTED RISK for Slice 0 and Slice 1 entry.**

**NOT production-ready until DM-001 is completed and the eight high findings are re-audited.**
