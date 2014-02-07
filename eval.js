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

var cmd = process.argv.slice(2).join(" ");

evalNock(cmd);

process.exit();

