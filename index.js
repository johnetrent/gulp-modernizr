'use strict';
var path = require('path');
var gutil = require('gulp-util');
var through = require('through');
var Promise = require('bluebird');
var customizr = require('customizr');

module.exports = function (fileName, opt) {

	// Set some defaults
	var PLUGIN_NAME = 'gulp-modernizr';
	var DEFAULT_FILE_NAME = 'modernizr.js';

	// Ensure fileName exists
	if (typeof fileName === 'undefined') {
		fileName = opt ? opt.dest : DEFAULT_FILE_NAME;
	} else if (typeof fileName === typeof {}) {
		opt = fileName;
		fileName = DEFAULT_FILE_NAME;
	}

	// Ensure opt exists
	opt = opt || {};

	// Enable string parsing in customizr
	opt.useBuffers = true;

	// Set crawl to false, Gulp is providing files & data
	opt.crawl = false;

	// Reset opt.files. Store buffers here.
	opt.files = {
		src: []
	};

	// Per Gulp docs (https://github.com/gulpjs/gulp/blob/master/docs/writing-a-plugin/guidelines.md)
	// "Your plugin shouldn't do things that other plugins are responsible for"
	opt.uglify = false;

	// Save first file for metadata purposes
	var firstFile = null;

	function storeBuffers(file) {

		// Return if null
		if (file.isNull()) {
			return;
		}

		// No stream support (yet?)
		if (file.isStream()) {
			stream.emit('error', new gutil.PluginError({
				plugin: PLUGIN_NAME,
				message: 'Streaming not supported'
			}));
		}

		// Set first file
		if (!firstFile) {
			firstFile = file;
		}

		// Save buffer for later use
		opt.files.src.push(file);

	}

	function generateModernizr(callback) {

		if (opt.files.src.length === 0) {
			stream.emit('end');
		}

		// Create a promise and call customizr
		var promise = new Promise(function(resolve, reject) {
			customizr(opt, function (data) {

				// Sanity check
				if (!data.result) {
					reject(
						stream
						.emit('error', new gutil.PluginError({
						   plugin: PLUGIN_NAME,
						   message: 'No data returned'
						}))
					);
				}
				else {
					resolve(
						// Save result
						new gutil.File({
							path: path.join(firstFile.base, fileName),
							base: firstFile.base,
							cwd: firstFile.cwd,
							contents: new Buffer(data.result)
						})
					);
				}
			});
		});

		return promise.then(function(result) {
			stream.emit('data', result);
			stream.emit('end');
		});
	}

	var stream = through(storeBuffers, generateModernizr);
	return stream;
};
