/*
 * For details as to what's going on here, check out Chapter 2 of the Urbit
 * documentation:
 * http://www.urbit.org/2013/08/22/Chapter-2-nock.html
 */

NOCK_VERSION = "5K";
NOCKJS_VERSION = "0.1";

DEBUG = 1;

function showDebug(msg) {
	if (DEBUG) console.log(msg);
}

var YES = 0;
var NO  = 1;

/*
The following functions make use of the official Urbit squiggle name conventions.  See here for details:
http://www.urbit.org/2013/08/22/Chapter-4-syntax.html
*/

function wut(noun) {
    /*
	? :: Test whether a noun is a cell or an atom.
    */
	showDebug("?" + formatList(noun));

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
    /* 
	 * Return an atom or a properly structured cell.  
	 */
    
    if (Array.isArray(a)) {
        return structureList(a);
    }
    else  {
		return a;
    }
}

function structureList(list) {
    /* Properly structure an improper list.
    2  ::    [a b c]           [a [b c]]
    */
	
	// If this list isn't actually a list, return it
	if (!Array.isArray(list))
		return list;

    if (list.length == 1) {
		if (Array.isArray(list[0])) 
			return [structureList(list[0]), 0];
		else 
			return [list[0], 0];
    }
    else if (list.length == 2) {
		return [structureList(list[0]), structureList(list[1])];
    }
    else {
        return [structureList(list[0]), structureList(list.slice(1))];
    }
}

function lus(noun) {
    /*
	+ :: Increment an atom.
    6  ::    +[a b]            +[a b]
    7  ::    +a                1 + a
	*/
	showDebug("+" + formatList(noun));

	if (Array.isArray(noun)) {
    	showDebug("6  ::    +[a b]            +[a b]");
		return "+" + formatList(noun);
	}
	else {
		showDebug("7  ::    +a                1 + a");
		return parseInt(noun) + 1;
	}
}

function tis(noun) {
	/*
    = :: test for equality
    8  ::    =[a a]            0
    9  ::    =[a b]            1
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
    */

	showDebug("/" + formatList(list));

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
		return "/[2 /[" + n / 2 + " " + formatList(noun) + "]]";
	}
	// #16, odd slot index
    else {
		showDebug("16 ::    /[(a + a + 1) b]  /[3 /[a b]]");
		return fas([3, fas([(n - 1) / 2, noun])]);
	}
}

function hasTwoItems(list) {
	return (Array.isArray(list) && list.length >= 2);
}

function hasThreeItems(list) {
	return (hasTwoItems(list) && hasTwoItems(list[1]));
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
	* -- Reduce a Nock expression.
    19 ::    *[a [b c] d]      [*[a b c] *[a d]]
    21 ::    *[a 0 b]          /[b a]
    22 ::    *[a 1 b]          b
    23 ::    *[a 2 b c]        *[*[a b] *[a c]]
    24 ::    *[a 3 b]          ?*[a b]
    25 ::    *[a 4 b]          +*[a b]
    26 ::    *[a 5 b]          =*[a b]
    28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
    29 ::    *[a 7 b c]        *[a 2 b 1 c]
    30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]
	31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]
	32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]
	33 ::    *[a 10 b c]       *[a c]
    */
	showDebug("*" + formatList(noun));

	var nounString = JSON.stringify(noun);
    noun = structureList(noun);

	if (!hasThreeItems(noun))
			throw Error("Invalid parameters for tar: " + nounString);

    var a = noun[0];
	var op = noun[1][0];
    var obj = noun[1][1];
	
	// #19
	if (Array.isArray(op)) {
		showDebug("19 ::    *[a [b c] d]      [*[a b c] *[a d]]");
		return [tar([a, op]), tar([a, obj])];
	}
	// #21: tree addressing
	else if (op == OP_FAS) {
    	showDebug("21 ::    *[a 0 b]          /[b a]");
		return fas([obj, a]);
	}
	// #22: constant operator
	else if (op == OP_CON) {
		showDebug("22 ::    *[a 1 b]          b");
		return obj;
	}
	// #23: recursion
	else if (op == OP_TAR) { 
		showDebug("23 ::    *[a 2 b c]        *[*[a b] *[a c]]");

		if (!hasTwoItems(obj))
			throw Error("Invalid arguments for the 2 operator");

		b = obj[0];
		c = obj[1];
		return tar([tar([a, b]), tar([a, c])]);
	}
	// #24: ?
	else if (op == OP_WUT) { 
		showDebug("24 ::    *[a 3 b]          ?*[a b]");
		return wut(tar([a, obj]));
	}
	// #25: +
	else if (op == OP_LUS) { 
		showDebug("25 ::    *[a 4 b]          +*[a b]");
		return lus(tar([a, obj]));
	}
	// #26: =
	else if (op == OP_TIS) { 
		console.log("<- 26 ::    *[a 5 b]          =*[a b]");
		return tis(tar([a, obj]));
	}
	// #28: if
	else if (op == OP_IF) { 
		console.log("28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]");
		if (!hasThreeItems(obj))
			throw Error("Invalid arguments for the 6 operator");

		b = obj[0];
		c = obj[1][0];
		d = obj[1][1];
		return tar([a, 2, [0, 1], 2, [1, c, d], [1, 0], 2, [1, 2, 3], [1, 0], 4, 4, b]); 
		// The reduced version:
		//return tar([a, tar([[c, d], [0, tar([[2, 3], 
		//			[0, lus(lus(tar([a, b])))]])]])]);
	}
	// #29: Function composition
	else if (op == OP_H07) {
		showDebug("29 ::    *[a 7 b c]        *[a 2 b 1 c]");
		if (!hasTwoItems(obj))
			throw Error("Invalid arguments for the 7 operator");

		b = obj[0];
		c = obj[1];
		return tar([a, 2, b, 1, c]); 
		// The reduced version:
		//return  tar([tar([a, b]), c]);
	}
	// #30: function composition with ordered pair
	else if (op == OP_H08) {
		showDebug("30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]");
		if (!hasTwoItems(obj))
			throw Error("Invalid arguments for the 8 operator");

		b = obj[0];
		c = obj[1];

		// TODO: This uses the reduction from Chap 2's appendix.  The unreduced
		// version doesn't quite work as expected.
		//return tar([a, 7, [[7, [0, 1], b], 0, 1], c]); 
		return tar([[tar([a, b]),  a], c]);
	}
	// #31: core
	else if (op == OP_H09) {
		showDebug("31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]");
		if (!hasTwoItems(obj))
			throw Error("Invalid arguments for the 9 operator");

		b = obj[0];
		c = obj[1];

		// TODO: Don't have any kind of test code for this.  The decrement
		// routine in chapter 2 makes use operation 9, and that totally doesn't
		// work at all.

		return tar([a, 7, c, 2, [0, 1], 0, b]); 
	}
	else if (op == OP_H10) {
		if (!hasTwoItems(obj)) 
				throw Error("Invalid arguments for the 10 operator");

		hint = obj[0];
		if (Array.isArray(hint)) {
			if (!hasTwoItems(obj[0])) 
				throw Error("Invalid arguments for the 10 operator");
				
			showDebug("32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]");
			c = obj[0][1];
			d = obj[1];

			// TODO: No test for this either.  See above about decrement,
			// though.
			return tar([a, 8, c, 7, [0, 3], d]);
			// The reduced version:
			//return tar([a d])
		}
		else {
			showDebug("33 ::    *[a 10 b c]       *[a c]");
			return tar([subj, obj[1]]);
		}
	}
}

var operators = "[\\?\\+\\=\\/\\*]";

function tokenize(str) {
	/* 
	 * Returns an array of tokens for a given nock expression
	 */

	var original = str;
	var tokens = new Array;

	while (str != "") {
		var operators_regex = new RegExp("^(" + operators + ")\s*(.*)");
		// If it's an operator
		if ((match = str.match(operators_regex)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		// If it's an atom
		else if ((match = str.match(/^(\d+)\s*(.*)/)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		// If it's either sort of bracket
		else if ((match = str.match(/^\s*([\[\]])\s*(.*)/)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		else {
			throw Error("Invalid input: \"" + original + "\"");
		}
	}

	return tokens;
}

function parseNock(str) {
	/*
	 * Take a nock string and generate the equivalent JavaScript function
	 */
	if (DEBUG > 1) console.log("Parsing: '" + str + "'");

	// This will only work if we start with one of our operators

	if (!str.match(operators)) {
		console.log("Invalid function: " + str);
		console.log("Functions should start with one of the following: ? / * + =");
	}

	var tokens = tokenize(str);

	return readFromTokens(tokens);
}

function readFromTokens(tokens) {
	/*
	 * Take the token array and generate a function
	 */
	
	var token = tokens.shift();
	token = token + "";

	// If it's an operator, return the appropriate operator function, and 
	// recursively call this function to get the parameters
	if ((match = token.match(operators)) != null) {
		var params = readFromTokens(tokens);
		if (token == "?") {
			return function() {
				return wut(params);
			}
		}
		else if (token == "+") {
			return function() {
				return lus(params);
			}
		}
		else if (token == "=") {
			return function() {
				return tis(params);
			}
		}
		else if (token == "/") {
			return function() {
				return fas(params);
			}
		}
		else if (token == "*") {
			return function() {
				return tar(params);
			}
		}
	}
	// Accept all unsigned integers
	else if (token.match(/\d+/)) {
		return token;
	}
	if (token == "[") {
		var array = new Array();
		while (tokens[0] != "]")  {
			array.push(readFromTokens(tokens));
		}
		tokens.shift();
		return array;
	}
	else if (token == "]") {
		throw Error("Unmatched ]");
	}
	else {
		
		// If we're still here, we got something weird
		throw Error("Unexpected input: " + token);
	}
}


function formatList(result) {
	/*
	 * Take the JavaScript return value and format it to look like nock
	 */


	// The return value should be either an atom or an array.  Or a string in a
	// crash condition.  The array could be an array of arrays.  
	if (!Array.isArray(result))
		return result + "";

	var returnVal = "["
	for (var i = 0; i < result.length; i++) {
		if (i != 0) {
			returnVal += " ";
		}

		if (Array.isArray(result[i]))
			returnVal += formatList(result[i]);
		else 
			returnVal += result[i]
	}		
	returnVal += "]";

	return returnVal;
}

// Exports for node.js
exports.parseNock = function(command) {
	return parseNock(command);
}

exports.formatList = function(list) {
	return formatList(list);
}
