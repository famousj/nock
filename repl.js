#!/usr/bin/env node

var nock = require("./nock.js");

function evalNock(command) {
	var jsFunction = nock.parseNock(command);

	var result = jsFunction();
	console.log(nock.formatList(result));
}

'use strict';

console.log("Nock ver. " + nock.NOCK_VERSION + 
			"; Nock.js ver. " + nock.NOCKJS_VERSION);
console.log("Control-C to exit");

process.stdout.write("> ");
	
process.stdin.resume();

process.stdin.on('data', function(line) {
	line = line + "";
	line = line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	if (line != "") 
		evalNock(line);
	
	process.stdout.write("> ");
});
