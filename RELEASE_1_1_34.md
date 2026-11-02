# OMD EVU Model Viewer v1.1.34 — functional GPU interpolation toggle

**Date:** November 2, 2026

## Interpolation correction

- Correct the Interpolate toggle so it updates the actual WebGL texture sampler parameters on existing panel textures. The prior implementation changed the requested filter property and re-uploaded field data, but the pinned WGLTexture implementation does not update texture filtering parameters in `setImageData()`.
- Apply `TEXTURE_MAG_FILTER` and `TEXTURE_MIN_FILTER` directly to each existing scalar texture and trigger a map repaint. This avoids Zarr downloads, decoding, data re-uploads, and map rebuilds.
- Ensure newly created textures and textures replaced during forecast-hour changes receive the selected filter.
- Preserve nearest-neighbor rendering for categorical precipitation type and Reflectivity-with-Ptype. Interpolation remains off by default and the browser preference remains persistent.

## Documentation and compatibility

- Update README, user guide, in-app guide, PDF, changelog, and cache-busting asset tokens.
- Update the companion converter reference to v1.4.13.
- No converter update, Zarr reprocessing, or data migration is required.

## Validation

- Add a regression test for actual WebGL `texParameteri` changes on existing textures, including toggling off and categorical-field safeguards.
- Verify ZIP integrity and web-readable `644` file / `755` directory permissions.
