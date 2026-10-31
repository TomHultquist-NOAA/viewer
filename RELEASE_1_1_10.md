# OMD EVU Model Viewer v1.1.10 — Compact overlay layout

Released October 30, 2026.

- Places the SPC Reports toggle in the same compact, wrapping overlay row as shaded-field Contours, Height, Wind, and observation toggles. When space permits, Contours and SPC Reports now appear side by side instead of on separate rows.
- Keeps report counts and data attribution below the toggles so variable-length report text does not force unnecessary wrapping.
- Preserves the responsive mobile and optional left-side toolbar layouts, and all existing overlay behavior.
- GitHub-ready distribution contains only this release note. README and guide language use generic processing/web server terms, with no deployment- or agency-specific assumptions.

No converter or data changes are required. Validate with `node --test tests/*.test.cjs` and a browser layout check.
