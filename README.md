# mapbox-map-image-export

A command-line tool to export a [Mapbox vector map][1], such as one created with [Mapbox Studio][2], to a high-resolution image for printing etc.

Mapbox has a [Maps static API][3] for exporting images, but it is limited to `1280px`, and exports as jpeg, with visible compression artifacts. `mapbox-map-image-export` renders the map in a headless browser and exports by default to uncompressed png. You can adjust the dpi setting for high-quality printing. `192dpi` (the default) is good enough for most print applications, but if you want better quality try `288dpi`. Icons will be 192dpi (retina) due to the way sprites are handled by `mapbox-gl-js`.

The Mapbox [wmts service][4] is another option for creating maps for printing in QGIS or ArcMap, but it does not currently support retina maps, so is limited to printing at around 72dpi, and is also only jpeg right now.

[1]: https://www.mapbox.com/maps/
[2]: https://www.mapbox.com/mapbox-studio/
[3]: https://www.mapbox.com/api-documentation/#static
[4]: https://www.mapbox.com/help/mapbox-arcgis-qgis/

```sh
export MAPBOX_TOKEN=YOUR_MAPBOX_API_PUBLIC_TOKEN

export-map mapbox://styles/mapbox/streets-v9 -w=11in -h=8.5in \
  -b=-7.1354,57.9095,-6.1357,58.516 -t=$MAPBOX_TOKEN -o=lewis.png
```

![lewis](lewis.png)

## Terms of Use

If you use this tool to export images from maps which include data from Mapbox, then you must follow the [Mapbox terms of service](https://www.mapbox.com/tos/):

- Exported images must only be used for non-commercial, non-profit or educational use.
- You must add attribution and the [Mapbox logo](https://www.mapbox.com/about/press/brand-guidelines/) to the printed map according to the Mapbox [attribution guidelines for static print](https://docs.mapbox.com/help/how-mapbox-works/attribution/#static--print).
- To secure permission to print images of a Mapbox style for a commercial project, please [contact Mapbox](https://www.mapbox.com/contact/sales/).

## Install

This tool uses Electron to render the map using [mapbox-gl-js][3], so it is fairly heavy (~100mb). Install with latest [npm](https://www.npmjs.com/).

[5]: https://www.mapbox.com/mapbox-gl-js/api/

```sh
npm install mapbox-map-image-export -g
```

## Usage

```txt
Usage:
  export-map mapboxStyleUrl

Options:
  --bounds, -b      comma-separated bounding box [required] 'minLon,minLat                        maxLon,maxLat' eg. '-7.1354,57.9095,-6.1357,58.516'
  --token, -t       Mapbox API token [required]:
                    https://www.mapbox.com/studio/account/tokens/
  --output, -o      image output path, optional, defaults to std.out
  --dpi, -d         dpi of output image, default 192dpi (equivalent to how the                    map renders on a retina screen)
  --format, -f      output format, "jpg", "webp" or "png" (default)
  --quality, -q     encoding quality for jpg and webp, default 0.9
  --width, -w       output width for printing e.g. 11in or 297mm
  --height, -h      output height for printing
  --help            show this help
  --version, -v     show version
  --debug           renders bounding box and (print) tile boundaries and opens                    the developer tools console
```

Exports a map for a given mapbox style url for the specified bounding box.

If no `--output` is given, the PNG is written to stdout.

## What does 'dpi' mean?

Mapbox Studio and Mapbox GL maps are designed for the screen, as such 'dpi' (dots per inch), a print term, does not have any real meaning. However, the standard screen resolution is equivalent to between 72 and 96dpi (e.g. 96 screen pixels will measure approximately 1 inch on a standard screen). Mapbox GL maps are designed by zoom level, and this tool assumes you want maps to look on paper roughly the same as they look on screen at the same size. `mapbox-map-image-export` assumes a standard resolution mapbox map is 96dpi, and a retina (@2x) map is 192dpi. You can set 288dpi if you like, and this will render as if to an ultra-retina screen with a devicePixelRatio=3. Keep dpi to a multiple of `96` if you want icons to look good.

## Acknowledgements

This is inspired by [extract-streetview](https://github.com/Jam3/extract-streetview) by [mattdesl](https://github.com/mattdesl). It uses [Electron](https://electron.atom.io/) to render the map in a headless version of Chrome.

## License

MIT
