var sourceMap = require('source-map');

/**
 *
 * @param options {Object}
 * @param options.usageData {[object]} - Array of dustme data objects
 * @param options.sourceMap {object} - sourcemap data as generated by compass
 */
function sourceMapReader(options) {
    this.sourceMapReader = null;
    this.usageData = options.usageData || [];
    this.sourceMapData = options.sourceMap;
    this.collatedData = {};

    this.parsingMode = undefined;

    /**
     * Collects all the data from the various sources organising the selectors in source files.
     * Uses sourcemap data to find the definition of the selector in the original scss file.
     * @returns {{}|*}
     */
    this.collateBySourceFile = function() {
        var self = this;
        self.sourceMapReader = new sourceMap.SourceMapConsumer(self.sourceMapData);

        self.usageData.forEach(function(dataSet) {

            if (dataSet) {
                self.parseUsageData(dataSet);
            }
        });

        return self.collatedData;
    };

    /**
     * Creates a summary object of already collated data.
     * @returns {{}|*}
     */
    this.produceSummary = function() {
        var self = this;
        var summary = [];

        for (var keyName in self.collatedData) {
            if (self.collatedData.propertyIsEnumerable(keyName)) {
                var obj = {
                    file: keyName,
                    used: self.collatedData[keyName].used.length,
                    unused: self.collatedData[keyName].unused.length
                };

                summary.push(obj);
            }
        }

        return summary;
    };

    /**
     * This parses an individual dustme data set. All data is added to this.collatedData
     * @param data
     */
    this.parseUsageData = function(data) {
        var self = this;

        ['unused', 'used'].forEach(function(parsingMode) {
            if (!data[parsingMode]) {
                return;
            }

            self.parsingMode = parsingMode;
            data[parsingMode].forEach(function(stylesheet) {
                if (!stylesheet.selectors) {
                    debugger;
                    return;
                }

                stylesheet.selectors.forEach(function(selector) {
                    var sourceData = self.sourceMapReader.originalPositionFor({
                        line: selector.line,
                        // -1 because Firefox (and therefore dustme) column numbers start at 1 but
                        // sourcemap standard starts at 0
                        column: selector.column - 1
                    });

                    if (!sourceData || sourceData.source === null) {
                        return;
                    }

                    if (!self.collatedData[sourceData.source]) {
                        self.collatedData[sourceData.source] = {
                            file: sourceData.source,
                            used: [],
                            unused: []
                        }
                    }

                    // Remove duplicates
                    // Better to do it here than to loop through all the files and selectors again.
                    if (parsingMode === 'used' && self.collatedData[sourceData.source]['unused'][selector.selector]) {
                        delete self.collatedData[sourceData.source]['unused'][selector.selector];
                    }
                    else if (parsingMode === 'unused' && self.collatedData[sourceData.source]['used'][selector.selector]) {
                        return;
                    }

                    self.collatedData[sourceData.source][self.parsingMode].push({
                        selector: selector.selector,
                        cssFile: stylesheet.url,
                        cssLine: selector.line,
                        cssColumn: selector.column,
                        scssFile: sourceData.source,
                        scssLine: sourceData.line,
                        scssColumn: sourceData.column
                    });

                });
            });

        });
    };


}

module.exports = sourceMapReader;


/**
 * Internal module for running the script from the command line.
 */
var consoleWrapper = function() {

    var fs = require("fs");
    var minimist = require('minimist');
    this.outputFilename = null;

    this.processArgs = function(argv) {
        var missingParams = !(argv.m && argv._.length > 0);
        var options = {};

        console.log('Argv: ', argv);

        if (argv.help || missingParams) {
            console.error("Usage: node index.js -n [notUsed.js] -y [yesUsed.json] -m [sourceMap.json] [-o [outputfile.json]]\n");
            console.error("-o is optional and if not supplied the result will be printed to stdout.\n");

            console.info();

            process.exit();
        }

        options.sourceMap = JSON.parse(fs.readFileSync(argv.m));
        options.usageData = [];

        argv._.forEach(function(filename) {
            options.usageData.push(JSON.parse(fs.readFileSync(filename)));
        });

        this.outputFilename = argv.o;

        return options;
    };

    this.process = function() {
        var options = this.processArgs(minimist(process.argv.slice(2)));
        var reader = new sourceMapReader(options);
        var usageData = JSON.stringify(reader.collateBySourceFile());
        //console.log(usageData);

        if (this.outputFilename) {
            fs.writeFileSync(this.outputFilename, usageData);
        }
        else {
            process.stdout.write(usageData);
        }

        fs.writeFileSync('summary.json', JSON.stringify(reader.produceSummary()));
    }
};

if (require.main === module) {
    return (new consoleWrapper()).process();

    console.log("called directly");
}



