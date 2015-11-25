# Dust-Me-to-Sass

Takes a number of dust-me exports and a sourcemap file and produce 
a new export showing where all the used/unused selector are in the original source file.

This requires a modified version of Dust-Me that can record the column numbers of the found selectors in it's json exports.

## Install

- Clone this repo using git
- Inside the project directory run `npm install`


## How to use

- Generate your css files as normal but make sure the generate source maps option is enabled.
This will be different depending on which generator you use.

- Use Dust-Me as normal on your site and export used and unused selectors for each host name you are auditing.

- Copy all the dust-me exports and the sourcemap files into a convenient location.

- from the Dust-me-to-sass directory run 'node index.js -m [path/to/sourcemap.map] -o [outputfile.json] [path/to/dustMeExport_1.json] [path/to/dustMeExport_2.json] [path/to/dustMeExport_n.json] [...]

This will create a file [outputfile.json] with a full report of all selectors found in all the exports and sourcemap.map, 
with their source file, line and column attached.

The report is structured by source file name. Used and unused selectors are listed separately.

It also creates summary.json which lists all the source files and how many used/unused selectors were found in them.

