#!/usr/bin/env node

var nock = require("./nock.js");

function setDebugging(debugging) {
	nock.setDebugging(debugging);
}

function evalNock(command) {
	console.log(nock.evalNock(command));

	return;
}


'use strict';

//setDebugging(false);

console.log("Nock ver. " + nock.NOCK_VERSION + 
			"; Nock.js ver. " + nock.NOCKJS_VERSION);
console.log("Control-C to exit");

process.stdout.write("> ");
	
process.stdin.resume();

process.stdin.on('data', function(line) {
	line = line + "";
	line = line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	if (line != "")  {
		try {
			evalNock(line);
		}
		catch (error) {
			console.log(error + "");
		}
	}
	
	process.stdout.write("> ");
});

