# Viewer v1.1.17 — Unique download filenames

**October 31, 2026**

- Assign a distinct filename to every exported individual-panel PNG, all-panels PNG, difference PNG, animated GIF, and right-click point time-series/sounding PNG. Keep descriptive field, model/run, valid-hour and/or location text where available.
- Add an export-time UTC timestamp (millisecond precision), a per-session token, and a monotonically increasing sequence to the filename **before** the `.png` or `.gif` extension. Repeated exports, even within the same millisecond, receive different names instead of browser-created `(1)`/`(2)` suffixes.
- No visual rendering, data conversion, theme, geographic export framing or other behavior changed. Compatible with Converter v1.4.2 and previously published data.

**Validation:** viewer automated tests and JavaScript syntax checks. Browser-managed download naming policies may vary by client.
