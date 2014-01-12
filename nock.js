/*
 * For details as to what's going on here, check out Chapter 2 of the Urbit
 * documentation:
 * http://www.urbit.org/2013/11/18/urbit-is-easy-ch2.html
 */

NOCK_VERSION = "5K";
NOCKJS_VERSION = "0.1";

DEBUG = 1;

var indent = 0;

function showDebug(msg) {
	if (DEBUG) {
		for (var i = 0; i < indent; i++) 
			process.stdout.write("    ");
			
		console.log(msg);
	}
}

function increaseIndent() {
	indent++;
}

function decreaseIndent() {
	if (indent > 0) 
		indent--;
}

var YES = 0;
var NO  = 1;

var operators = "[\\?\\+\\=\\/\\*]";
var atom = "[\\d.]+";
var bracket = "[\\[\\]]";

function isOperator(token) {
	return token.match(operators);
}

function isAtom(token) {
	return token.match(atom);
}

/*
The following functions make use of the official Urbit rune name conventions.  
This is also to be found in Chapter 2:
http://www.urbit.org/2013/11/18/urbit-is-easy-ch2.html
*/

function _wut(noun) {
    /*
	? :: Test whether a noun is a cell or an atom.
    */

	return Array.isArray(noun) && noun.length != 1 ? YES : NO;
}

function wut(noun, debug) {
    /*
	? :: Test whether a noun is a cell or an atom.
    */
	
	debug = typeof debug !== 'undefined' ? debug : false;

	if (Array.isArray(noun) || 
		typeof noun == 'string' && noun[0] == "[" && noun[noun.length-1] == "]") {
		if (debug) showDebug("4  ::    ?[a b]            0");
		return YES;
	}
	else {
		if (debug) showDebug("5  ::    ?a                1");
		return NO;
	}
}

function structureList(list) {
    /* Properly structure an improper list.
    2  ::    a b c]           a [b c]]
    */ 

	// If this list is actually an atom
	if (wut(list) == NO)
		return list;

    if (list.length == 1) {
		if (wut(list[0]) == YES) 
			return [structureList(list[0]), 0];
		else 
			return [list[0], 0];
    }
    else if (list.length == 2) {
		return [structureList(list[0]), structureList(list[1])];
    }
    else {
		// 2  ::    a b c]           a [b c]]
		showDebug("2  ::    a b c]           a [b c]]");

		increaseIndent();
		showDebug("[b c]");
		var c = structureList(list.pop());
		var b = structureList(list.pop());
		var cell = [b, c];
		showDebug(formatList(cell));

		decreaseIndent();

		list.push(cell);

		showDebug("");
		showDebug(formatList(list));

        return structureList(list);
    }
}

function lus(noun) {
    /*
	+ :: Increment an atom.
    6  ::    +[a b]            +[a b]
    7  ::    +a                1 + a
	*/

	if (wut(noun) == YES) {
    	showDebug("6  ::    +[a b]            +[a b]");
		showDebug("CRASH!");
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
	10 ::    =a                =a
    */
	if (wut(noun) == NO) {
		showDebug("10 ::    =a                =a");
		showDebug("CRASH!");
		return "=" + noun;
	}
	else if (noun[0] == noun[1])  {
    	showDebug("8  ::    =[a a]            0");
		return YES;
	}
	else {
    	showDebug("9  ::    =[a b]            1");
		return NO;
	}
}

function hasTwoItems(list) {
	/*
	 * Returns true if the (properly structured) list has two or more items in it
	 */

	return (wut(list) == YES && list.length >= 2);
}

function hasThreeItems(list) {
	/*
	 * Returns true if the (properly structured) list has three or more items in it
	 */

	return (hasTwoItems(list) && hasTwoItems(list[1]));
}

function fas(list) {
	/*
    Return the specified slot from the given noun.
    12 ::    /[1 a]            a
    13 ::    /[2 a b]          a
    14 ::    /[3 a b]          b
    15 ::    /[(a + a) b]      /[2 /[a b]]
    16 ::    /[(a + a + 1) b]  /[3 /[a b]]
    17 ::    /a                /a
    */

	if (wut(list) == NO) {
    	showDebug("17 ::    /a                /a");
		showDebug("CRASH!");
		return "/" + list;
	}

	if (!hasTwoItems(list)) 
		throw Error("Invalid arguments for the / operator");

	var n = list[0];
	/*
	if (list.length == 2) 
		noun = structureList(list[1]) ;
	else
		noun = structureList(list.slice(1));
	*/

	if (n == 1) {
		showDebug("12 ::    /[1 a]            a");
		return noun;
	}

	if (!hasThreeItems(list)) 
		throw Error("Invalid arguments for the / operator");

	if (n == 2) {
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
		showDebug("/[2 /[" + n / 2 + " " + formatList(noun) + "]]");

		increaseIndent();

		showDebug("/[a b]");
		showDebug("/" + formatList([ (n / 2), noun]));
		var innerFas = fas([ n/2, noun]);
		showDebug(formatList(innerFas))

		decreaseIndent();

		showDebug("");
		showDebug("/[2 " + formatList(innerFas) + "]");
		var outerFas = fas([2, innerFas]);


		return outerFas;
	}
	// #16, odd slot index
    else {
		showDebug("16 ::    /[(a + a + 1) b]  /[3 /[a b]]");
		showDebug("/[3 /[" + (n-1) / 2 + " " + formatList(noun) + "]]");

		increaseIndent();

		showDebug("/[a b]");
		showDebug("/" + formatList([((n-1) / 2), noun]));
		var innerFas = fas([ (n-1) / 2, noun]);
		showDebug(formatList(innerFas));

		decreaseIndent();
		showDebug("/" + formatList([3, innerFas]));
		var outerFas = fas([3, innerFas]);


		return outerFas;

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

	35 ::    *a                *a
    */

	var nounString = JSON.stringify(noun);
    //noun = structureList(noun);

	if (wut(noun) == NO) {
		showDebug("35 ::    *a                  *a");
		showDebug("CRASH!");
		return "*" + noun;
	}

	if (!hasThreeItems(noun)) {
		throw Error("Invalid parameters for tar: " + nounString);
	}

    var a = noun[0];
	var op = noun[1][0];
    var obj = noun[1][1];
	
	// #19
	if (wut(op) == YES) {
		showDebug("19 ::    *[a [b c] d]      [*[a b c] *[a d]]");

		increaseIndent();
		showDebug("*[a b c]");
		showDebug("*" + formatList([a, op]));
		var tar1 = tar([a, op]);

		showDebug("");
		showDebug("*[a d]");
		showDebug("*" + formatList([a, obj]));
		var tar2 = tar([a, obj]);

		decreaseIndent();

		return [tar1, tar2];
	}
	// #21: tree addressing
	else if (op == OP_FAS) {
    	showDebug("21 ::    *[a 0 b]          /[b a]");
		showDebug("/" + formatList([obj, a]));
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
		
		increaseIndent();
		showDebug("*[a b]");
		showDebug("*" + formatList([a, b]));
		var tar1 = tar([a, b]);
		showDebug(formatList(tar1));

		showDebug("");
		showDebug("*[a c]");
		showDebug("*" + formatList([a, c]));
		var tar2 = tar([a, c]);
		showDebug(formatList(tar2));

		decreaseIndent();

		showDebug("");
		showDebug("*[*[a b] *[a c]]");
		showDebug("*" + formatList([tar1, tar2]));

		return tar([tar1, tar2]);
	}
	// #24: ?
	else if (op == OP_WUT) { 
		showDebug("24 ::    *[a 3 b]          ?*[a b]");

		increaseIndent();
		showDebug("*[a b]");
		showDebug("*" + formatList([a, obj]));
		tar = tar([a, obj]);
		showDebug(formatList(tar));

		decreaseIndent();

		showDebug("");
		showDebug("?*[a b]");
		showDebug("?" + formatList(tar));

		return wut(tar, true);
	}
	// #25: +
	else if (op == OP_LUS) { 
		showDebug("25 ::    *[a 4 b]          +*[a b]");

		increaseIndent();
		showDebug("*[a b]");
		showDebug("*" + formatList([a, obj]));
		tar = tar([a, obj]);
		showDebug(formatList(tar));

		decreaseIndent();

		showDebug("");
		showDebug("+*[a b]");
		showDebug("+" + formatList(tar));

		return lus(tar);
	}
	// #26: =
	else if (op == OP_TIS) { 
		showDebug("<- 26 ::    *[a 5 b]          =*[a b]");

		increaseIndent();
		showDebug("*[a b]");
		showDebug("*" + formatList([a, obj]));
		tar = tar([a, obj]);
		showDebug(formatList(tar));

		decreaseIndent();

		showDebug("");
		showDebug("=*[a b]");
		showDebug("=" + formatList(tar));

		return tis(tar);
	}
	// #28: if
	else if (op == OP_IF) { 
		showDebug("28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]");
		if (!hasThreeItems(obj))
			throw Error("Invalid arguments for the 6 operator");

		b = obj[0];
		c = obj[1][0];
		d = obj[1][1];

		var params = 
			[a, 2, [0, 1], 2, [1, c, d], [1, 0], 2, [1, 2, 3], [1, 0], 4, 4, b]; 
		showDebug("*" + formatList(params));
		return tar(params);
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
		var params = [a, 2, b, 1, c]; 
		showDebug("*" + formatList(params));
		return tar(params);
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
		//
		var params = [a, 7, c, 2, [0, 1], 0, b]; 
		showDebug("*" + formatList(params));
		return tar(params);
	}
	else if (op == OP_H10) {
		if (!hasTwoItems(obj)) 
				throw Error("Invalid arguments for the 10 operator");

		hint = obj[0];
		if (wut(hint) == YES) {
			if (!hasTwoItems(obj[0])) 
				throw Error("Invalid arguments for the 10 operator");
				
			showDebug("32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]");
			c = obj[0][1];
			d = obj[1];

			// TODO: No test for this either.  See above about decrement,
			// though.
			var params = [a, 8, c, 7, [0, 3], d];
			showDebug("*" + formatList(params));
			return tar(params);
			// The reduced version:
			//return tar([a d])
		}
		else {
			showDebug("33 ::    *[a 10 b c]       *[a c]");
			var params = [subj, obj[1]];
			showDebug("*" + formatList(params));
			return tar([subj, obj[1]]);
		}
	}
}

function tokenize(str) {
	/* 
	 * Returns an array of tokens for a given nock expression
	 */

	var original = str;
	var tokens = [];

	while (str != "") {
		var operators_regex = new RegExp("^(" + operators + ")\\s*(.*)");
		var atom_regex = new RegExp("^(" + atom + ")\\s*(.*)");
		var bracket_regex = new RegExp("^\\s*(" + bracket + ")\\s*(.*)");

		// If it's an operator
		if ((match = str.match(operators_regex)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		// If it's an atom
		else if ((match = str.match(atom_regex)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		// If it's either sort of bracket
		else if ((match = str.match(bracket_regex)) != null) {
			tokens.push(match[1]);
			str = match[2];
		}
		else {
			throw Error("Invalid input: \"" + original + "\"");
		}
	}

	return tokens;
}

/*
function verifyCell(tokens, index) { 
	var atoms = 0; 
	//var depth = 0; 
	
	var end = i;
			
	while (index > 0) {
		index--;
		token = newTokens[i];

		console.log("Next: '" + token + "'");
		console.log(atom);

		if (token.match("[")) {
			if (atoms == 2) {
				return index;
			
			}
			else if (isAtom(token)) {
				console.log("ATOM");
				atoms++; 
				if (atoms > 2) {
					console.log("Too many atoms!");
					console.log(expressionToString(newTokens));
					newTokens.splice(end, 0, "]");
					console.log(expressionToString(newTokens));
					newTokens.splice(i+1, 0, "[");
					console.log(expressionToString(newTokens));
					return newTokens;
				}
			}
			else {
				break;
			}
		}
	// TODO: If we're here, we have unbalanced brackets
	}
}
*/

function expressionToString(tokens) {
	var str = "";

	for (i = 0; i < tokens.length; i++) {
		token = tokens[i];

		if (isAtom(token) && tokens.length > i+1 && tokens[i+1] != "]") {
			str += token + " ";
		}
		else {
			str += token;
		}
	}

	return str;
}

function popNoun(expr) {
	/*
	 * Remove the last noun in the list of tokens.  
	 * This routine is optimistic, in that it assumes that all tokens are
	 * either valid operators or valid atoms, and it assumes that all lists are
	 * pairs (i.e. cells).
	 * If the last token on the list is an operator, it returns that, even
	 * though that's totally not a noun.  Otherwise, this would not work with
	 * nested operations, (e.g. *[*[1 2] *[3 4]]).
	 */

	var token = expr.pop();

	if (token == "]") {
		var noun = [];
		while (expr[expr.length-1] != "[") {
			var newNoun = popNoun(expr);

			if (Array.isArray(newNoun)) {

				for (var i = 0; i < newNoun.length; i++) {
					noun.push(newNoun[i]);
				}
			}
			else {
				noun.unshift(newNoun);
			}
		}

		noun.unshift(expr.pop());

		noun.push(token);

		if (isOperator(expr[expr.length-1])) {
			noun.unshift(expr.pop());
		}

		return noun;
	}	
	else {
		return token;
	}
}

function expressionsAreTheSame(expr1, expr2) {
	return expressionToString(expr1) == expressionToString(expr2);
}

function validateAndAddBrackets(expr) {
	/*
	 6  ::    [a b c]          [a [b c]]
	 Take an array of tokens.  If there's a bracket with three (or more) 
	 nouns, add brackets for the last two nouns.  
	 Otherwise, return the token array unchanged.
	 In the process of which, validate that there's nothing off about this noun
	 */
	

	// Just an atom is valid
	if (expr.length == 1) {
		if (!isAtom(expr[0]))
			throw Error("Invalid expression: " + expressionToString(expr));
		
		return expr;
	}

	// An operator and an atom is also valid
	if (expr.length == 2) {
		if (isOperator(expr[0]) && isAtom(expr[1]))
			return expr;
	}
		
	var newexpr = expr.slice(0);

	// The last character should be "]"
	var ser = newexpr.pop();

	if (ser != "]") {
		throw Error("Invalid expression: " + expressionToString(expr));
	}
	
	var c = popNoun(newexpr);

	var newc = validateAndAddBrackets(c);
	if (!expressionsAreTheSame(c, newc)) 
		return newexpr.concat(newc, ser);

	// Don't allow a cell with one item
	if (newexpr[newexpr.length-1] == "[") 
		throw Error("Invalid expression: " + expressionToString(expr));

	var b = popNoun(newexpr);
	var newb = validateAndAddBrackets(b);
	if (!expressionsAreTheSame(b, newb)) 
		return newexpr.concat(newb).concat(c).concat(ser);

	var a = newexpr.pop();

	// At this point if we have a "[", this rule doesn't apply
	if (a == "[") {
		return expr;
	}

	return newexpr.concat(a, "[", b, c, "]", ser);

	/*
	if (expr.length <= 2) {
		if (expr.indexOf("[") != -1 || expr.indexOf("]") != -1)
			throw Error("Ill-formed expression: " + expressionToString(expr));

		return expr;
	}
	*/
}

function evalNock(str) {
	/*
	 * Take a string of nock pseudocode and run through the reductions until we
	 * detect a crash or get a value.
	 */
	
	if (DEBUG > 1) console.log("Evaluating: '" + str + "'");

	var operatorRegex = "^" + operators;
	if (!isOperator(str)) {
	 	showDebug("5  ::    nock(a)             *a");
		str = "*" + str;
		showDebug(str);
	}

	var expr = tokenize(str);

	var done = false;

	while (!done) {
		var newExpr = validateAndAddBrackets(expr);

		if (!expressionsAreTheSame(expr, newExpr)) {
			showDebug("6  ::    [a b c]          [a [b c]]");
			showDebug(expressionToString(newExpr));
			expr = newExpr;
			continue;
		}

		done = true;
	}

	showDebug("===");

	return expressionToString(expr);
}

function readFromTokens(tokens) {
	/*
	 * Take the token array and generate a function
	 */
	
	var token = tokens.shift();
	token = token + "";

	// If it's an operator, return the appropriate operator function, and 
	// recursively call this function to get the parameters
	if (isOperator(token)) {
		var params = readFromTokens(tokens);
		if (token == "?") {
			return function() {
				return wut(params, wut);
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
	else if (isAtom(token)) {
		return token;
	}
	if (token == "[") {
		var array = [];
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
	if (wut(result) == NO)
		return result + "";

	var returnVal = "["
	for (var i = 0; i < result.length; i++) {
		if (i != 0) {
			returnVal += " ";
		}

		if (wut(result[i]) == YES)
			returnVal += formatList(result[i]);
		else 
			returnVal += result[i]
	}		
	returnVal += "]";

	return returnVal;
}

// Exports for node.js
//
exports.NOCK_VERSION = NOCK_VERSION;
exports.NOCKJS_VERSION = NOCKJS_VERSION;

exports.evalNock = function(command) {
	return evalNock(command);
}

exports.formatList = function(list) {
	return formatList(list);
}
