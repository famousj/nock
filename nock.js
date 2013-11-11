#!/usr/bin/env node

//N.B. Implementation functions have a `_` prefix. Public functions do not

/*
import re
import collections
import contextlib
import logging

logger = logging.getLogger('nock')
DEFAULT_LEVEL = logger.getEffectiveLevel()
__all__ = ['YES', 'NO', 'fas', 'lus', 'nock', 'tar', 'tis', 'wut',
           'debug']
*/

// TODO: Add in a whole bunch of comments from Urbit docs

// TODO: Starting with here, and the fact that YES is 0
var YES = 0;
var NO  = 1;

/*
The following functions make use of the official Urbit squiggle name conventions.  See here for details:
http://www.urbit.org/2013/08/22/Chapter-4-syntax.html
*/

function _wut(noun) {
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
		return YES;
	}
	else {
		return NO;
	}
}


function _aorc(a) {
    /* Return an atom or a properly structured cell.  
    >>> _aorc(1)
    1
    >>> _aorc([1,2])
    [1, 2] 
    */
    
    if (_wut(a) == YES) {
        return _t(a);
    }
    else  {
		return a;
    }
}

function _t(list) {
    /* Properly structure an improper list.

    2  ::    [a b c]           [a [b c]]

    >>> _t([1])
    [1, 0]
    >>> _t([1, 2])
    [1, 2]
    >>> _t([1, 2, 3])
    [1, [2, 3]]
    >>> _t([1, 2, 3, 4])
    [1, [2, [3, 4]]]
    >>> _t([42, [[4, 0, 1], [3, 0, 1]]])
    [42, [[4, [0, 1]], [3, [0, 1]]]]
    */

    if (list.length == 1) {
        return [_aorc(list[0]), 0];
    }
    else if (list.length == 2) {
        return [_aorc(list[0]), _aorc(list[1])];
    }
    else {
        return [_aorc(list[0]), _t(list.slice(1))];
    }
}

function _lus(noun) {
    /*
	+ :: Increment an atom.

    6  ::    +[a b]            +[a b]
    7  ::    +a                1 + a

    >>> lus([1, 2])
    [1, 2]
    >>> lus(1)
    2
	*/

	if (_wut(noun) == YES) {
		return noun;
	}
	else {
		return noun + 1;
	}
}

function _tis(noun) {
	/*
    = :: test for equality

    8  ::    =[a a]            0
    9  ::    =[a b]            1

    >>> tis([1, 1])
    0
    >>> tis([1, 0])
    1
    */
	if (noun[0] == noun[1]) 
		return YES;
	else
		return NO;
}

function _fas(list) {
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
		noun = _aorc(list[1]);
	else 
		noun = _aorc(list.slice(1));

	// #12
	if (n == 1)
		return noun;
	// #13
	else if (n == 2)
		return noun[0];
	// #14
	else if (n == 3)
		return noun[1];
	// #15, even slot index
    else if (!(n % 2)) 
		return _fas([2, _fas([n / 2, noun])]);
	// #16, odd slot index
    else 
		return _fas([3, _fas([(n - 1) / 2, noun])]);
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

function _tar(noun) {
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

    noun = _t(noun);

    subj = _fas([2, noun]);	// noun[0]
    op = _fas([6, noun]); 	// noun[1][0]
    obj = _fas([7, noun]);  // noun[1][1]
	
	// TODO: Figure out what Mr. Eyk was up to with the indent thing
	
	// #19
	if (_wut(op) == YES) {
		console.log("<- 19 ::    *[a [b c] d]      [*[a b c] *[a d]]");
		return (_tar([subj, op]), _tar([subj obj]));
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
		b = _fas([2, obj]);
		c = _fas([3, obj]);
		return tar([tar([subj, b]), tar([subj, c]));
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
                b = _fas((2, obj))
                c = _fas((6, obj))
                d = _fas((7, obj))
                with _indent():
                    return tar((a, 2, (0, 1), 2, (1, c, d), (1, 0), 2, (1, 2, 3), (1, 0), 4, 4, b))

            elif op == OP_H07:
                _d("<- 29 ::    *[a 7 b c]        *[a 2 b 1 c]")
                b = _fas((2, obj))
                c = _fas((3, obj))
                with _indent():
                    return tar((subj, 2, b, 1, c))

            elif op == OP_H08:
                _d("<- 30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]")
                b = _fas((2, obj))
                c = _fas((3, obj))
                with _indent():
                    return tar((subj, 7, ((7, (0, 1), b), 0, 1), c))

            elif op == OP_H09:
                _d("<- 31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]")
                b = _fas((2, obj))
                c = _fas((3, obj))
                with _indent():
                    return tar((subj, 7, c, 2, (0, 1), 0, b))

            elif op == OP_H10:
                hint = _fas((2, obj))
                if _wut(hint) == YES:
                    _d("<- 32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]")
                    c = _fas((2, hint))
                    with _indent():
                        return tar((subj, 8, c, 7, (0, 3), obj))
                else:
                    _d("<- 33 ::    *[a 10 b c]       *[a c]")
                    c = _fas((3, obj))
                    with _indent():
                        return tar((subj, c))
}

/*
### HELPERS, because WE NEED HELP.
##################################
def _r(noun):
    """Return a Nock-like repr() of the given noun.

    >>> _r((42, 0, 1))
    '[42 0 1]'
    """
    if isinstance(noun, int):
        return repr(noun)
    else:
        return '[%s]' % ' '.join(_r(i) for i in noun)


DEBUG_LEVEL = 0


@contextlib.contextmanager
def _indent():
    """Context manager to raise and lower the debug output indentation level.
    """
    global DEBUG_LEVEL
    DEBUG_LEVEL += 1
    try:
        yield
    finally:
        DEBUG_LEVEL -= 1


def _d(*args):
    """Log, at the given indentation level, the given logging arguments.
    """
    level = DEBUG_LEVEL * ' '
    a = level + args[0]
    return logger.debug(a, *args[1:])


def _public(original_func, formatter):
    """Create a public interface w/ debug warts.
    """
    def wrapper(noun):
        _d(formatter, _r(noun))
        result = original_func(noun)
        with _indent():
            _d(_r(result))
        return result
    wrapper.__name__ = original_func.__name__.replace('_', '')
    wrapper.__doc__ = original_func.__doc__
    return wrapper

### Public interface for Nock implementation functions.
#######################################################
wut = _public(_wut, '?%s')
lus = _public(_lus, '+%s')
tis = _public(_tis, '=%s')
fas = _public(_fas, '/%s')
tar = _public(_tar, '*%s')


def nock(n):
    """Reduce a Nock expression.

    >>> nock((2, 0, 1))
    2
    >>> nock('[2 0 1]')
    2
    >>> nock('*[2 0 1]')
    2
    """
    expr = n
    if isinstance(n, basestring):
        expr = parse(n)
        if n.startswith('*'):
            return expr

    return tar(expr)


def debug(on=True):
    """Switch debug mode on.

    This logs each step of a Nock reduction, with indentation, so that you can
    kinda sorta tell what the heck is going on.
    """
    root = logging.getLogger()
    if on:
        if not root.handlers:
            logging.basicConfig(level=logging.DEBUG)
        logger.setLevel(logging.DEBUG)
    else:
        logger.setLevel(DEFAULT_LEVEL)


### The PARSER
##################
TOKENS_CP = re.compile(r'\[|\]|[0-9]+|[*?=/+]')
NUMBERS = set('0123456789')
OPS = {
    '/': fas,
    '+': lus,
    '*': tar,
    '=': tis,
    '?': wut,
}


def _construct(tk_iter, token):
    """Construct and reduce Nock sub-expressions.
    """
    if token == '[':
        out = []
        token = tk_iter.next()
        while token != ']':
            out.append(_construct(tk_iter, token))
            token = tk_iter.next()

        return tuple(out)
    if token in OPS:
        return OPS[token](_construct(tk_iter, tk_iter.next()))
    elif token[0] in NUMBERS:
        return int(token)

    raise SyntaxError("Malformed Nock expression.")


def parse(s):
    """Nock parser.

    Based on effbot's `iterator-based parser`_.

    .. _iterator-based parser: http://effbot.org/zone/simple-iterator-parser.htm
    """
    tokens = iter(TOKENS_CP.findall(s))
    return _construct(tokens, tokens.next())


def main():
    import sys
    import readline
    readline.parse_and_bind('tab: complete')
    logging.basicConfig(level=logging.DEBUG, format='%(message)s')

    print "Welcome to Nock! (`:q` or ^D to quit; `:debug on` to enter debug mode)"
    print "    (If you're totally confused, read http://www.urbit.org/2013/08/22/Chapter-2-nock.html)"
    print
    try:
        DEBUG = False
        while True:
            line = raw_input('-> ').strip()
            if not line:
                continue
            elif line == ':q':
                break

            elif line.startswith(':debug'):
                if line.endswith('off'):
                    DEBUG = False
                elif line.endswith('on'):
                    DEBUG = True
                else:
                    DEBUG = not DEBUG

                debug()
            else:
                print _r(parse(line))
                print
    except EOFError:
        pass

    print "Good-bye!"
    print
    sys.exit()

if __name__ == "__main__":
    main()

	*/
