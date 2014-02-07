
/*
 * For details as to what's going on here, check out Chapter 2 of the Urbit
 * documentation:
 * http://www.urbit.org/
 */

NOCK_VERSION = "5K";
NOCKJS_VERSION = "0.3";

DEBUG = 1;

/* The largest integer that can be represented with JavaScript's Number type.
 * This is based on Ecma-262 Edition 5.1, The ECMAScript Language
 * Specification:
 * http://www.ecma-international.org/ecma-262/5.1/#sec-8.5
 */
MAX_INT = Math.pow(2, 53);

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


QUICK_BRACKETS = 1;
QUICK_BRACKETS_REGEX = "^QB\\=(.+)$";
function isQuickBracketsCommand(string) {
	return string.toLowerCase().match(QUICK_BRACKETS_REGEX);
}

function getQuickBracketsValue(string) {
	if ((match = string.toLowerCase().match(QUICK_BRACKETS_REGEX)) != null) {
		if (match[1].toLowerCase() == "true" || 
			match[1].toLowerCase() == "yes"  ||
			match[1].toLowerCase() == "on" )
			return true;
		else if (match[1].toLowerCase() == "false" ||
				 match[1].toLowerCase() == "no"    || 
				 match[1].toLowerCase() == "off")
			return false;
	}
	throw Error("Invalid value for quick brackets!");

}

function setQuickBrackets(qbValue) {
	if (qbValue) {
		showDebug("Quick brackets are now ON");
		QUICK_BRACKETS = 1;
	}
	else {
		showDebug("Quick brackets are now OFF");
		QUICK_BRACKETS = 0;
	}
}

STRICT = 1;
STRICT_REGEX = "^strict=(.*)$";
function isStrictCommand(string) {
	return string.toLowerCase().match(STRICT_REGEX);
}

function getStrictValue(string) {
	if ((match = string.toLowerCase().match(STRICT_REGEX)) != null) {
		if (match[1].toLowerCase() == "true" || 
			match[1].toLowerCase() == "yes"  ||
			match[1].toLowerCase() == "on" )
			return true;
		else if (match[1].toLowerCase() == "false" ||
				 match[1].toLowerCase() == "no"    || 
				 match[1].toLowerCase() == "off")
			return false;
	}
	throw Error("Invalid value for setting strict");
}

function setStrict(strictValue) {
	if (strictValue) {
		showDebug("Strict is now ON");
		STRICT = 1;
	}
	else {
		showDebug("Strict is now OFF");
		STRICT = 0;
	}
}

var YES = 0;
var NO  = 1;

var operators = "[\\?\\+\\=\\/\\*]";
var atom = "[\\d.]+";
var bracket = "[\\[\\]]";

function isOperator(token) {
	var op = "" + token;
	return op.match(operators);
}

function isAtom(token) {
	if (Array.isArray(token)) {
		if (token.length > 1) 
			return false;

		a = "" + token[0];
	}
	else {
		a = "" + token;
	}
	
	return a.match(atom);
}

/*
The following functions make use of the official Urbit rune name conventions.  
This is also to be found in Chapter 2:
http://www.urbit.org/2013/11/18/urbit-is-easy-ch2.html
*/

function wut(noun, debug) {
    /*
	? :: Test whether a noun is a cell or an atom.
	8  ::    ?[a b]           0
	9  ::    ?a               1
    */

	debug = typeof debug !== 'undefined' ? debug : false;

	if (isAtom(noun)) {
		if (debug) showDebug("9  ::    ?a               1");
		return NO;
	}
	else {
		if (debug) showDebug("8  ::    ?[a b]           0");
		return YES;
	}
}

function lus(noun) {
    /*
	+ :: Increment an atom.
	10 ::    +[a b]           +[a b]
	11 ::    +a               1 + a
	*/

	if (wut(noun, false) == YES) {
		showDebug("10 ::    +[a b]           +[a b]");
		return(noun);
	}
	else { 
		showDebug("11 ::    +a               1 + a");
		var atom = Array.isArray(noun) ? noun[0] : noun;
		showDebug("1 + " + atom);
		var atomInt = parseInt(atom);
		if (atomInt >= MAX_INT) {
			throw Error("Integer too large for JavaScript; cannot increment it");
		}
		return 1 + atomInt;
	}
}

function tis(noun) {
	/*
    = :: test for equality
	12 ::    =[a a]           0
	13 ::    =[a b]           1
	14 ::    =a               =a
	*/
	if (wut(noun, false) == NO) {
		showDebug("14 ::    =a               =a");
		return noun;
	}
	else if (noun[1] == noun[2])  {
    	showDebug("12 ::    =[a a]           0");
		return YES;
	}
	else {
    	showDebug("12 ::    =[a b]           1");
		return NO;
	}
}

function fas(noun) {
	/*
    Return the specified slot from the given noun.
	16 ::    /[1 a]           a
	17 ::    /[2 a b]         a
	18 ::    /[3 a b]         b
	19 ::    /[(a + a) b]     /[2 /[a b]]
	20 ::    /[(a + a + 1) b] /[3 /[a b]]
	21 ::    /a               /a
	*/

	if (isAtom(noun)) { 
		showDebug("21 ::    /a               /a");
		return noun;
	}

	var newNoun = noun.slice(0);

	var sel = newNoun.shift();

	var axis = shiftExpression(newNoun);
	var tree = shiftExpression(newNoun);

	if (wut(axis, false) == YES) {
		showDebug("21 ::    /a               /a");
		return noun;
	}

	if (axis == 1) {
		showDebug("16 ::    /[1 a]           a");
		return tree;
	}

	if (wut(tree, false) == NO) {
		showDebug("21 ::    /a               /a");
		return noun;
	}

	var newTree = tree.slice(1);

	if (wut(newTree, false) == NO) {
		showDebug("21 ::    /a               /a");
		return noun;
	}

	var a = shiftExpression(newTree);
	var b = shiftExpression(newTree);

	if (axis == 2) {
		showDebug("17 ::    /[2 a b]         a");
		return a;
	}
	else if (axis == 3) {
		showDebug("18 ::    /[3 a b]         b");
		return b;
	}
	else if (!(axis % 2)) {
		showDebug("19 ::    /[(a + a) b]     /[2 /[a b]]");
		return [].concat("/", "[", 2, "/", "[", axis / 2, tree, "]", "]");
	}
	else {
		showDebug("20 ::    /[(a + a + 1) b] /[3 /[a b]]");
		return [].concat("/", "[", 3, "/", "[", (axis-1) / 2, tree, "]", "]");
	}
}

function tar(noun) {
	/* Apply the Nock formula
	23 ::    *[a [b c] d]     [*[a b c] *[a d]]
	24 ::
	25 ::    *[a 0 b]         /[b a]
	26 ::    *[a 1 b]         b
	27 ::    *[a 2 b c]       *[*[a b] *[a c]]
	28 ::    *[a 3 b]         ?*[a b]
	29 ::    *[a 4 b]         +*[a b]
	30 ::    *[a 5 b]         =*[a b]
	31 ::
	32 ::    *[a 6 b c d]     *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
	33 ::    *[a 7 b c]       *[a 2 b 1 c]
	34 ::    *[a 8 b c]       *[a 7 [[7 [0 1] b] 0 1] c]
	35 ::    *[a 9 b c]       *[a 7 c 2 [0 1] 0 b]
	36 ::    *[a 10 [b c] d]  *[a 8 c 7 [0 3] d]
	37 ::    *[a 10 b c]      *[a c]
	38 ::
	39 ::    *a               *a
	*/
	
	if (wut(noun, false) == NO) {
		showDebug("39 ::    *a               *a");
		return noun;
	}

	var newNoun = noun.slice(0);

	var sel = newNoun.shift();

	var subject = shiftExpression(newNoun);
	var formula = shiftExpression(newNoun);

	if (wut(formula, false) == NO) {
		showDebug("39 ::    *a               *a");
		return noun;
	}

	sel = formula.shift();
	ser = formula.pop();
	var operator = shiftExpression(formula);
	var operands = formula;

	if (wut(operator, false) == YES) {
		// Remove sel and ser from the front and back, respectively
		sel = operator.shift();
		b = shiftExpression(operator);
		c = shiftExpression(operator);
		d = operands;

		showDebug("23 ::    *[a [b c] d]     [*[a b c] *[a d]]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(b));
		showDebug("c: " + expressionToString(c));
		showDebug("d: " + expressionToString(d));

		if (STRICT) {
			return [].concat("[", "*", "[", subject, b, c, "]", 
						      "*", "[", subject, d, "]", "]");
		}
		else {
			return [].concat("[", "*", "[", subject, "[", b, c, "]", 
							 "]", "*", "[", subject, d, "]", "]");
		}
	}

	// FAS
	if (operator == 0) {
		showDebug("25 ::    *[a 0 b]         /[b a]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(operands));
		return [].concat("/", "[", operands, subject, "]");
	}
	// Ignore the subject
	else if (operator == 1) {
		showDebug("26 ::    *[a 1 b]         b");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(operands));
		return operands;
	}
	// Generate a new subject
	else if (operator == 2) {
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		var b = shiftExpression(operands);
		var c = shiftExpression(operands);

		showDebug("27 ::    *[a 2 b c]       *[*[a b] *[a c]]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(b));
		showDebug("c: " + expressionToString(c));
		return [].concat("*", "[", "*", "[", subject, b, "]",
								   "*", "[", subject, c, "]", "]");
	}
	// WUT
	else if (operator == 3) { 
		showDebug("28 ::    *[a 3 b]         ?*[a b]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(operands));
		return [].concat("?", "*", "[", subject, operands, "]");
	}
	// LUS
	else if (operator == 4) {
		showDebug("29 ::    *[a 4 b]         +*[a b]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(operands));
		return [].concat("+", "*", "[", subject, operands, "]");
	}
	// TIS
	else if (operator == 5) {
		showDebug("30 ::    *[a 5 b]         =*[a b]");
		showDebug("a: " + expressionToString(subject));
		showDebug("b: " + expressionToString(operands));
		return [].concat("=", "*", "[", subject, operands, "]");
	}
	// if-then-else
	else if (operator == 6) {
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		var b = shiftExpression(operands);
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		var c = shiftExpression(operands);
		var d = shiftExpression(operands);
		if (STRICT) {
			showDebug(
"32 ::    *[a 6 b c d]     *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]");

			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			showDebug("d: " + expressionToString(d));
			return [].concat("*", "[", subject, 2, "[", 0, 1, "]", 2, 
								  "[", 1, c, d, "]",
								  "[", 1, 0, "]", 2, 
								  "[", 1, 2, 3, "]",
								  "[", 1, 0, "]", 4, 4, b, "]");
		} 
		else {
			showDebug(
"32r ::   *[a 6 b c d]               *[a *[[c d] [0 *[[2 3] [0 ++*[a b]]]]]]");

			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			showDebug("d: " + expressionToString(d));
			return [].concat("*", "[", subject, "*", "[", "[", c,  d, "]",
							      "[", 0, "*", "[", "[", 2, 3, "]",
								  "[", 0, "+", "+", "*", "[", subject, b,
								  "]", "]", "]", "]", "]", "]");
		}
	}
	else if (operator == 7) {

		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		var b = shiftExpression(operands);
		var c = shiftExpression(operands);

		if (STRICT) {
			showDebug("33 ::    *[a 7 b c]       *[a 2 b 1 c]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", subject, 2, b, 1, c, "]");
		}
		else {
			showDebug("33r ::     *[a 7 b c]      *[*[a b]  c]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", "*", "[", subject, b, "]", c, "]");
		}
	}
	else if (operator == 8) {
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		ser = operands.pop();
		var b = shiftExpression(operands);
		var c = operands;

		if (STRICT) {
			showDebug("34 ::    *[a 8 b c]       *[a 7 [[7 [0 1] b] 0 1] c]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", subject, 7, "[", "[", 7, "[", 0, 1, "]",
			 				 b, "]", 0, 1, "]", c, "]");
		}
		else {
			showDebug("34r ::    *[a 8 b c]       *[[*[a b] a] c]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));

			return [].concat("*", "[", "[", "*", "[", subject, b, "]",  
							subject, "]", c, "]");
		}
	}
	else if (operator == 9) {
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		var b = shiftExpression(operands);
		var c = shiftExpression(operands);

		if (STRICT) {
			showDebug("35 ::    *[a 9 b c]       *[a 7 c 2 [0 1] 0 b]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", subject, 7, c, 2, "[", 0, 1, "]", 
							 0, b, "]");
		}
		else {
			showDebug("35r ::    *[a 9 b c]       *[*[a c] *[*[a c] 0 b]]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", "*", "[", subject, c, "]", 
							 "*", "[", "*", "[", subject, c, "]", 0, b, 
							 "]", "]");
		}
	}
	else if (operator == 10) {
		if (wut(operands, false) == NO) {
			showDebug("39 ::    *a               *a");
			return noun;
		}

		sel = operands.shift();
		ser = operands.pop();
		var firstOperand = shiftExpression(operands);

		if (wut(firstOperand, false) == NO) {
			var b = firstOperand;
			var c = operands;

			showDebug("37 ::    *[a 10 b c]      *[a c]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			return [].concat("*", "[", subject, c, "]");
		}

		sel = firstOperand.shift();
		var b = shiftExpression(firstOperand);
		var c = shiftExpression(firstOperand);

		var d = shiftExpression(operands);


		if (STRICT) {
			showDebug("36 ::    *[a 10 [b c] d]  *[a 8 c 7 [0 3] d]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			showDebug("d: " + expressionToString(d));
			return [].concat('*', '[', subject, 8, c, 7, 
							 '[', 0, 3, ']', d, ']');
		}
		else {
			showDebug("36r ::    *[a 10 [b c] d]   *[*[[*[a c] a] 0 3] d]");
			showDebug("a: " + expressionToString(subject));
			showDebug("b: " + expressionToString(b));
			showDebug("c: " + expressionToString(c));
			showDebug("d: " + expressionToString(d));
			return [].concat("*", "[", "*", "[", "[", "*", "[", subject, c, "]",
							 subject, "]", 0, 3, "]", d, "]");
		}
	}

	// If we get all the way down here, nothing applied, the operator is
	// greater than 10.  So apply line 39
	showDebug("39 ::    *a               *a");
	return noun;

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
			throw Error("Invalid expression: \"" + original + "\"");
		}
	}

	return tokens;
}

function expressionToString(tokens) {
	var str = "";

	if (!Array.isArray(tokens)) {
		return '' + tokens;
	}

	for (i = 0; i < tokens.length; i++) {
		token = tokens[i];

		if (isAtom(token) && tokens.length > i+1 && tokens[i+1] != "]") 
			str += token + " ";
		else if (token == "]" && tokens.length > i+1 && tokens[i+1] != "]")
			str += token + " ";
		else 
			str += token;
	}

	return str;
}

function popExpression(expr) {
	/*
	 * Remove the last expression in the list of tokens.  
	 *
	 * For the purposes of this module an "Expression" is either a noun or an
	 * operator and a noun. For instance, an expression can be 44, [1 2], ?44, 
	 * ?[1 2].
	 *
	 * 
	 * This routine assumes that if a token is not a * valid operator, it's a 
	 * valid atom.  This also doesn't check if it's a pair, it just makes sure 
	 * the brackets are balanced.
	 */

	var token = expr.pop();

	if (token == "]") {
		var noun = [];
		while (expr[expr.length-1] != "[") {
			var newExpr = popExpression(expr);

			if (Array.isArray(newExpr)) {

				for (var i = newExpr.length-1; i >= 0; i--) {
					noun.unshift(newExpr[i]);
				}
			}
			else {
				noun.unshift(newExpr);
			}
		}

		noun.unshift(expr.pop());

		noun.push(token);

		while (isOperator(expr[expr.length-1])) {
			noun.unshift(expr.pop());
		}

		return noun;
	}	
	else {
		return token;
	}
}

function shiftExpression(expr) {
	/*
	 * Remove the first expression in the list of tokens.  
	 * This routine assumes that if a token is not a valid operator, it's a 
	 * valid atom.  This also doesn't check if it's a
	 * pair, it just makes sure the brackets are balanced.
	 */

	var noun = [];

	var ops = [];
	for (var token = expr.shift(); isOperator(token); token = expr.shift()) {
		ops.push(token);
	}

	if (token == "[") {
		while (expr[0] != "]") {
			var newExpr = shiftExpression(expr);

			if (Array.isArray(newExpr)) {
				for (var i = 0; i < newExpr.length; i++) {
					noun.push(newExpr[i]);
				}
			}
			else {
				noun.push(newExpr);
			}
		}

		noun.push(expr.shift());

		noun.unshift(token);

		if (ops.length) {
			noun = ops.concat(noun);
		}

		return noun;
	}	
	else {
		if (ops.length) 
			return ops.concat(token);
		else 
			return token;
	}
}

function indexOfNextOperator(noun, startingAt) {

	startingAt = (typeof startingAt !== 'undefined') ? startingAt : 0;

	for (var i = startingAt; i < noun.length; i++) {
		if (isOperator(noun[i])) 
			return i;
	}

	return -1;
}

function expressionsAreTheSame(expr1, expr2) {
	return expressionToString(expr1) == expressionToString(expr2);
}

function validateExpression(expr) {

	// Any number of operators prefixing the expression are valid.
	var index = 0;
	while (isOperator(expr[index])) 
		index++;

	// Just operators (optionally) and an atom is valid
	if (expr.length == index+1) {
		return isAtom(expr[index]);
	}

	// Make sure we either start with a [ or with an op[
	if (expr[index] != "[") 
		return false;

	// The final token should be ]
	if (expr[expr.length-1] != "]")
		return false;

	return true;
}

function addBrackets(expr) {
	/*
	 6  ::    [a b c]          [a [b c]]
	 Take an array of tokens.  If there's a bracket with three (or more) 
	 nouns (or expressions, since those will (hopefully) get reduced to 
	 expressions), add brackets for the last two nouns.  
	 Otherwise, return the token array unchanged.
	 */
	
	if (!Array.isArray(expr) || expr.length <= 2)
		return expr;

	var newExpr = expr.slice(0);

	// The last character should be "]"
	var ser = newExpr.pop();

	var c = popExpression(newExpr);

	// Recursive call to add brackets to this expr, possibly
	var newC = addBrackets(c);

	if (!expressionsAreTheSame(newC, c)) 
		return newExpr.concat(newC, ser);

	// Don't allow a cell with one item
	if (newExpr[newExpr.length-1] == "[") 
		throw Error("Can't add brackets to expression: " + 
						expressionToString(expr));

	var b = popExpression(newExpr);

	var newB = addBrackets(b);
	if (!expressionsAreTheSame(newB, b)) 
		return newExpr.concat(newB, c, ser);

	// At this point if we have a "[", this rule doesn't apply
	if (newExpr[newExpr.length-1] == "[") {
		return expr;
	}

	return newExpr.concat("[", b, c, "]", ser);
}

function quickAddBrackets(expr) {
	/*
	 6  ::    [a b c]          [a [b c]]
	 Take an array of tokens.  Add brackets iteratively and recursively until 
	 they're all balanced.
	 */
	
	if (!Array.isArray(expr) || expr.length <= 2)
		return expr;

	var newExpr = expr.slice(0);

	// The last character should be "]"
	var ser = newExpr.pop();

	var c = quickAddBrackets(popExpression(newExpr));

	// Don't allow a cell with one item
	if (newExpr[newExpr.length-1] == "[") 
		throw Error("Can't add brackets to expression: " + 
						expressionToString(expr));

	var b = quickAddBrackets(popExpression(newExpr));

	// Until we come across an atom and not a sel...
	while (newExpr[newExpr.length-1] != "[") {
		c = [].concat("[", b, c, "]");
		b = quickAddBrackets(popExpression(newExpr));
	}

	return newExpr.concat( b, c, ser);
}

function evalNock(str) {
	/*
	 * Take a string of nock pseudocode and run through the reductions until we
	 * detect a crash or get a value.
	 */
	
	if (isQuickBracketsCommand(str)) {
		setQuickBrackets(getQuickBracketsValue(str));
		return "";
	}

	if (isStrictCommand(str)) {
		setStrict(getStrictValue(str));
		return "";
	}
	
	if (DEBUG > 1) console.log("Evaluating: '" + str + "'");

	var operatorRegex = "^" + operators;
	if (!isOperator(str)) {
	 	showDebug("5  ::    nock(a)             *a");
		str = "*" + str;
		showDebug(str);
	}

	var tokens = tokenize(str);

	var expr = shiftExpression(tokens.slice(0));

	if (expr.length != tokens.length) 
		throw Error("Invalid expression: " + expressionToString(tokens));

	return expressionToString(reduceExpression(expr));

}

function reduceExpression(expr) {
	var done = false;

	while (!done) {
		showDebug("Reducing " + expressionToString(expr));
		
		if (!validateExpression(expr)) {
			showDebug("Can't validate this: " + expr);
			throw Error("Invalid expression: " + expressionToString(expr));
		}

		// See if there are any sub-operations that need to be dealt with
		var opIndex = indexOfNextOperator(expr, 1);

		if (opIndex != -1) {
			var left = expr.slice(0, opIndex);
			var right = expr.slice(opIndex);
			var subNoun = shiftExpression(right);

			increaseIndent();

			var newSubNoun = reduceExpression(subNoun);

			if (newSubNoun == "CRASH") {
				return newSubNoun;
			}

			if (expressionsAreTheSame(newSubNoun, subNoun)) {
				showDebug("CRASH!");
				return "CRASH";

				expr = ["CRASH"];
				done = true;
			}
			else {
				showDebug(expressionToString(newSubNoun));
			}

			decreaseIndent();

			expr = left.concat(newSubNoun, right);
			continue;
		}
		 
		var newExpr;
		if (QUICK_BRACKETS || !STRICT) {
			var newExpr = quickAddBrackets(expr);
			if (!expressionsAreTheSame(expr, newExpr)) {
				showDebug("6  ::    [a b c]          [a [b c]]");
				showDebug(expressionToString(newExpr));
				expr = newExpr;
			}
		}
		else {
			var newExpr = addBrackets(expr);

			if (!expressionsAreTheSame(expr, newExpr)) {
				showDebug("6  ::    [a b c]          [a [b c]]");
				showDebug(expressionToString(newExpr));
				expr = newExpr;
				continue;
			}
		}

		var op = expr[0];

		if (!isOperator(op)) 
			return expr;
		else
			expr.shift();

		if (op == "?") {
			newExpr = wut(expr);
		}
		else if (op == "+") {
			newExpr = lus(expr);
		}
		else if (op == "=") {
			newExpr = tis(expr);
		}
		else if (op == "/") {
			newExpr = fas(expr);
		}
		else if (op == "*") {
			newExpr = tar(expr);
		}

		if (expressionsAreTheSame(expr, newExpr)) {
			showDebug("CRASH!");
			return "CRASH";
		}
		else {
			expr = newExpr;
			if (indexOfNextOperator(expr) == -1) {
				done = true;
			}
		}

		showDebug(expressionToString(expr));

	}

	showDebug("===");

	return expr;
}

// Exports for node.js
//
exports.NOCK_VERSION = NOCK_VERSION;
exports.NOCKJS_VERSION = NOCKJS_VERSION;

exports.evalNock = function(command) {
	return evalNock(command);
}

exports.setDebugging = function(debugging) {
	DEBUG = debugging;
}

exports.setQuickBrackets = function(quickBrackets) {
	setQuickBrackets(quickBrackets);
}

exports.setStrict = function(strict) {
	setStrict(strict);
}

