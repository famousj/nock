#!/usr/bin/env node

//N.B. Implementation functions have a `_` prefix. Public functions do not
NOCK_VERSION = "5K";
NOCKJS_VERSION = "0.1";

DEBUG = 2;

function showDebug(msg) {
	if (DEBUG) console.log(msg);
}

// TODO: Add in a whole bunch of comments from Urbit docs

// TODO: Starting with here, and the fact that YES is 0
var YES = 0;
var NO  = 1;

/*
The following functions make use of the official Urbit squiggle name conventions.  See here for details:
http://www.urbit.org/2013/08/22/Chapter-4-syntax.html
*/

function wut(noun) {
    /*
	? :: Test whether a noun is a cell or an atom.

    4  ::    ?[a b]            0
    5  ::    ?a                1

    >>> ?([1, 2])
    0
    >>> ?(1)
    1
    */
	if (Array.isArray(noun)) {
		showDebug("4  ::    ?[a b]            0");
		return YES;
	}
	else {
		showDebug("5  ::    ?a                1");
		return NO;
	}
}


function aorc(a) {
    /* Return an atom or a properly structured cell.  
    >>> aorc(1)
    1
    >>> aorc([1,2])
    [1, 2] 
    */
    
    if (Array.isArray(a)) {
        return properize(a);
    }
    else  {
		return a;
    }
}

function properize(list) {
    /* Properly structure an improper list.

    2  ::    [a b c]           [a [b c]]

    >>> properize([1])
	ERROR
    >>> properize([1, 2])
    [1, 2]
    >>> properize([1, 2, 3])
    [1, [2, 3]]
    >>> properize([1, 2, 3, 4])
    [1, [2, [3, 4]]]
    >>> properize([42, [[4, 0, 1], [3, 0, 1]]])
    [42, [[4, [0, 1]], [3, [0, 1]]]]
    */

    if (list.length == 1) {
        var newlist = [aorc(list[0]), 0];
		showDebug(newlist);
		return newlist;
    }
    else if (list.length == 2) {
        return [aorc(list[0]), aorc(list[1])];
    }
    else {
        return [aorc(list[0]), properize(list.slice(1))];
    }
}

function lus(noun) {
    /*
	+ :: Increment an atom.

    6  ::    +[a b]            +[a b]
    7  ::    +a                1 + a

    >>> lus([1, 2])
    "lus([1, 2])"
    >>> lus(1)
    2
	*/

	if (Array.isArray(noun)) {
    	showDebug("6  ::    +[a b]            +[a b]");
		return "+" + formatResult(noun);
	}
	else {
		return noun + 1;
	}
}

function tis(noun) {
	/*
    = :: test for equality

    8  ::    =[a a]            0
    9  ::    =[a b]            1

    >>> tis([1, 1])
    0
    >>> tis([1, 0])
    1
    */
	if (noun[0] == noun[1])  {
    	showDebug("8  ::    =[a a]            0");
		return YES;
	}
	else {
    	showDebug("9  ::    =[a b]            1");
		return NO;
	}
}

function fas(list) {
	/*
    Return the specified slot from the given noun.

    12 ::    /[1 a]            a
    13 ::    /[2 a b]          a
    14 ::    /[3 a b]          b
    15 ::    /[(a + a) b]      /[2 /[a b]]
    16 ::    /[(a + a + 1) b]  /[3 /[a b]]

    >>> tree = [[4, 5], [6, 14, 15]]
    >>> fas([1, tree])
    [[4, 5], [6, [14, 15]]]
    >>> fas((2, tree))
    [4, 5]
    >>> fas((3, tree))
    [6, [14, 15]]
    >>> fas((7, tree))
    [14, 15]
    */

	var n = list[0];
	var noun;
	if (list.length == 2) 
		noun = aorc(list[1]);
	else 
		noun = aorc(list.slice(1));

	if (n == 1) {
		showDebug("12 ::    /[1 a]            a");
		return noun;
	}
	else if (n == 2) {
		showDebug("13 ::    /[2 a b]          a");
		return noun[0];
	}
	else if (n == 3) {
		showDebug("14 ::    /[3 a b]          b");
		return noun[1];
	}
	// #15, even slot index
    else if (!(n % 2)) {
		showDebug("15 ::    /[(a + a) b]      /[2 /[a b]]");
		showDebug(noun);
		showDebug(formatResult(noun));
		return "/[2 /[" + n / 2 + " " + formatResult(noun) + "]]";
	}
	// #16, odd slot index
    else {
		showDebug("16 ::    /[(a + a + 1) b]  /[3 /[a b]]");
		return fas([3, fas([(n - 1) / 2, noun])]);
	}
}

OP_FAS = 0;
OP_CON = 1;
OP_TAR = 2;
OP_WUT = 3;
OP_LUS = 4;
OP_TIS = 5;
OP_IF  = 6;
OP_H07 = 7;
OP_H08 = 8;
OP_H09 = 9;
OP_H10 = 10;

function tar(noun) {
    /*
	*[a, b] -- Reduce a Nock expression.

    ## 19 ::    *[a [b c] d]      [*[a b c] *[a d]]
    >>> tar((42, ((4, 0, 1), (3, 0, 1))))
    (43, 1)

    ## 21 ::    *[a 0 b]          /[b a]
    >>> tar((2, 0, 1))
    2
    >>> tar((((4, 5), (6, 14, 15)), (0, 7)))
    (14, 15)

    ## 22 ::    *[a 1 b]          b
    >>> tar((42, 1, 5))
    5
    >>> tar((42, (1, 153, 218)))
    (153, 218)

    ## 23 ::    *[a 2 b c]        *[*[a b] *[a c]]
    >>> tar((77, (2, (1, 42), (1, 1, 153, 218))))
    (153, 218)

    ## 24 ::    *[a 3 b]          ?*[a b]
    ## 25 ::    *[a 4 b]          +*[a b]
    ## 26 ::    *[a 5 b]          =*[a b]
    >>> tar((57, (0, 1)))
    57
    >>> tar(((132, 19), (0, 3)))
    19
    >>> tar(((42, 43), (3, 0, 1)))
    0
    >>> tar((42, (3, 0, 1)))
    1
    >>> tar((57, (4, 0, 1)))
    58
    >>> tar((((57, 57), (5, 0, 1))))
    0
    >>> tar((((57, 58), (5, 0, 1))))
    1

    ## 28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
    >>> tar((42, (6, (1, 0), (4, 0, 1), (1, 233))))
    43
    >>> tar((42, (6, (1, 1), (4, 0, 1), (1, 233))))
    233

    ## 29 ::    *[a 7 b c]        *[a 2 b 1 c]
    >>> tar((42, (7, (4, 0, 1), (4, 0, 1))))
    44

    ## 30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]
    >>> tar((42, (8, (4, 0, 1), (0, 1))))
    (43, 42)
    >>> tar((42, (8, (4, 0, 1), (4, 0, 3))))
    43

    ## 33 ::    *[a 10 b c]       *[a c]
    >>> tar(((132, 19), (10, 37, (4, 0, 3))))
    20
    */

    noun = properize(noun);

    subj = fas([2, noun]);	// noun[0]
    op = fas([6, noun]); 	// noun[1][0]
    obj = fas([7, noun]);  // noun[1][1]
	
	// TODO: Figure out what Mr. Eyk was up to with the indent thing
	
	// #19
	if (wut(op) == YES) {
		console.log("<- 19 ::    *[a [b c] d]      [*[a b c] *[a d]]");
		return (tar([subj, op]), tar([subj, obj]));
	}
	// #21: tree addressing
	else if (op == OP_FAS) {
		console.log("<- 21 ::    *[a 0 b]          /[b a]");
		return fas([obj, subj]);
	}
	// #22: constant operator
	else if (op == OP_CON) {
		console.log("<- 22 ::    *[a 1 b]          b");
		return obj
	}
	// #23: recursion
	else if (op == OP_TAR) { 
		console.log("<- 23 ::    *[a 2 b c]        *[*[a b] *[a c]]");
		b = fas([2, obj]);
		c = fas([3, obj]);
		return tar([tar([subj, b]), tar([subj, c])]);
	}
	// #24: ?
	else if (op == OP_WUT) { 
		console.log("<- 24 ::    *[a 3 b]          ?*[a b]");
		return wut(tar([subj, obj]));
	}
	// #25: +
	else if (op == OP_LUS) { 
		console.log("<- 25 ::    *[a 4 b]          +*[a b]");
		return lus(tar([subj, obj]));
	}
	// #26: =
	else if (op == OP_TIS) { 
		console.log("<- 26 ::    *[a 5 b]          =*[a b]");
		return tis(tar([subj, obj]));
	}
	// #28: if
	else if (op == OP_IF) { 
		console.log("<- 28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]");
		a = subj
		b = fas([2, obj]);
		c = fas([6, obj]);
		d = fas([7, obj]);
		return tar([a, 2, [0, 1], 2, [1, c, d], [1, 0], 2, [1, 2, 3], [1, 0], 4, 4, b]); 
	}
	else if (op == OP_H07) {
		console.log("<- 29 ::    *[a 7 b c]        *[a 2 b 1 c]");
		b = fas([2, obj]);
		c = fas([3, obj]);
		return tar([subj, 2, b, 1, c]); 
	}
	else if (op == OP_H08) {
		console.log("<- 30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]");
		b = fas([2, obj]);
		c = fas([3, obj]); 
		return tar([subj, 7, [[7, [0, 1], b], 0, 1], c]); 
	}
	else if (op == OP_H09) {
		console.log("<- 31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]");
		b = fas([2, obj]);
		c = fas([3, obj]);
		return tar([subj, 7, c, 2, [0, 1], 0, b]); 
	}
	else if (op == OP_H10) {
		hint = fas([2, obj]);
		if (wut(hint) == YES) {
			console.log("<- 32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]");
			c = fas([2, hint]);
			return tar([subj, 8, c, 7, [0, 3], obj]);
		}
		else {
			console.log("<- 33 ::    *[a 10 b c]       *[a c]");
			c = fas([3, obj]);
			return tar([subj, c]);
		}
	}
}

function parseNock(str) {
	/*
	 * Take a nock string and generate the equivalent JavaScript command
	 */
	if (DEBUG > 1) console.log("Parsing: '" + str + "'");
	if (str == "") {
		return "";
	}

	if (str[0] == '?') {
		return "wut(" + parseNock(str.slice(1)) + ")";
	}
	else if (str[0] == "/") {
		return "fas(" + parseNock(str.slice(1)) + ")";
	}
	else if (str[0] == "+") {
		return "lus(" + parseNock(str.slice(1)) + ")";
	}
	else if (str[0] == "*") {
		return "tar(" + parseNock(str.slice(1)) + ")";
	}
	else if (str[0] == "=") {
		return "tis(" + parseNock(str.slice(1)) + ")";
	}

	// Remove matching sel and ser
	if ((matches = str.match(/^(.*)\[([^\[\]]+)\](.*)$/)) != null) {
		return parseNock(matches[1]) + 
			   "[" + parseNock(matches[2]) + "]" +
			   parseNock(matches[3]);
	}

	// if the next character is 

	// digits followed by possible whitespace, and end of line 
	if ((matches = str.match(/^(\d+\s*)$/)) != null) 
		return matches[1];

	// digits with a space and then something else get a comma :0
	if ((matches = str.match(/^(\d+)\s+(.+)/)) != null) 
		return matches[1] + ", " + parseNock(matches[2]);

	// If we're still here, we got something weird
	throw Error("Unexpected input: " + str);
}


function formatResult(result) {
	/*
	 * Take the javascript return value and format it to look nocky
	 */

	// The return value should be either an atom or an array.
	// The array could be an array of arrays.  

	if (DEBUG > 1) console.log("formatting " + result);

	if (!Array.isArray(result))
		return result + "";

	var returnVal = "["
	for (var i = 0; i < result.length; i++) {
		if (i != 0) {
			returnVal += " ";
		}

		if (Array.isArray(result[i]))
			returnVal += formatResult(result[i]);
		else 
			returnVal += result[i]
	}		
	returnVal += "]";

	return returnVal;
}

function nock(command) {
	while (typeof command == "string") {
		if (DEBUG > 1) console.log(command);

		// TODO: Yes, I'm using the dreaded eval statement.  This is version
		// 0.1 and this is  the least amount of code to write.   Since the 
		// parser immediately blows up on anything not an operator, digit, 
		// [ or ], I don't // _think_ this would be an issue.  But I'm not 
		// sure.  Hence TODO here is to think up a cuter way of doing things.
		var jsCommand = parseNock(command);


		var result = eval(jsCommand);

		// Don't loop infinitely.  
		// TODO: think of some other kind of infinite loop detection
		if (formatResult(result) == command) {
			console.log(result);
			showDebug("Exiting now to avoid an infinite loop");
			return;
		}
		
		command = result;

		if (typeof(command) == "string")
			showDebug(command);
		else 
			console.log(formatResult(result));
	}
}

'use strict';

console.log("Nock ver. " + NOCK_VERSION);
console.log("Nock.js ver. " + NOCKJS_VERSION);
console.log("Control-C to exit");

process.stdout.write("> ");
	
process.stdin.resume();

process.stdin.on('data', function(line) {
	line = line + "";
	line = line.replace(/^\s\s*/, '').replace(/\s\s*$/, '');

	nock(line);
	
	process.stdout.write("> ");
});

