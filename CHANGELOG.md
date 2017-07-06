# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2017-07-06
### Changed
- Switch from using [jam3/devtool](https://github.com/Jam3/devtool) to directly spawning electron

### Added
- Log progress to a single line

### Fixed
- Ensure tiles are loaded before exporting map

### Known Issues
- Export to stdout does not exit process on completion (need to Ctrl-C to exit)

[2.2.0]: https://github.com/digidem/mapbox-map-image-export/compare/v2.1.0...v2.2.0
