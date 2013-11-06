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

/*
    >>> fas((3, tree))
    [6, [14, 15]]
    >>> fas((7, tree))
    [14, 15]

"""
Line 21:
--------

Now we enter the definition of Nock itself - ie, the `*` operator.

    21 ::    *[a 0 b]          /[b a]

`0` is simply Nock’s tree-addressing operator. Let’s try it out from the Arvo command line.

Note that we’re using Hoon syntax here. Since we do not use Nock from Hoon all that often (it’s sort of like embedding assembly in C), we’ve left it a little cumbersome. In Hoon, instead of writing `*[a 0 b]`, we write

    .*(a [0 b])

So, to reuse our slot example, let’s try the interpreter:

    ~tasfyn-partyv> .*([[4 5] [6 14 15]] [0 7])

gives, while the sky remains blue and the sun rises in the east:

    [14 15]

Even stupider is line 22:

Line 22:
--------

    22 ::    *[a 1 b]          b

1 is the constant operator. It produces its argument without reference to the subject. So

    ~tasfyn-partyv> .*(42 [1 153 218])

yields

    [153 218]

Line 23:
--------

    23 ::    *[a 2 b c]        *[*[a b] *[a c]]

Line 23 brings us the essential magic of recursion. 2 is the Nock operator. If you can compute a subject and a formula, you can evaluate them in the interpreter. In most fundamental languages, like Lisp, eval is a curiosity. But Nock has no apply - so all our work gets done with 2.

Let’s convert the previous example into a stupid use of 2:

    ~tasfyn-partyv> .*(77 [2 [1 42] [1 1 153 218]])

with a constant subject and a constant formula, gives the same

    [153 218]

Like so:

    *[77 [2 [1 42] [1 1 153 218]]

    23 ::    *[a 2 b c]        *[*[a b] *[a c]]

    *[*[77 [1 42]] *[77 [1 1 153 218]]]

    21 ::    *[a 1 b]          b

    *[42 *[77 [1 1 153 218]]]

    *[42 1 153 218]

    [153 218]

Lines 24-25:
------------

    24 ::    *[a 3 b]          ?*[a b]
    25 ::    *[a 4 b]          +*[a b]
    26 ::    *[a 5 b]          =*[a b]

In lines 25-26, we meet our axiomatic functions again:

For instance, if `x` is a formula that calculates some product, `[4 x]` calculates that product plus one. Hence:

    ~tasfyn-partyv> .*(57 [0 1])
    57

and

    ~tasfyn-partyv> .*([132 19] [0 3])
    19

and

    ~tasfyn-partyv> .*(57 [4 0 1])
    58

and

    ~tasfyn-partyv> .*([132 19] [4 0 3])
    20


Line 19:
--------

    19 ::    *[a [b c] d]      [*[a b c] *[a d]]

Um, what?

Since Nock of an atom just crashes, the practical domain of the Nock function is always a cell. Conventionally, the head of this cell is the “subject,” the tail is the “formula,” and the result of Nocking it is the “product.” Basically, the subject is your data and the formula is your code.

We could write line 19 less formally:

    *[subject [formula-x formula-y]]
    =>  [*[subject formula-x] *[subject formula-y]]

In other words, if you have two Nock formulas `x` and `y`, a formula that computes the pair of them is just `[x y]`. We can recognize this because no atom is a valid formula, and every formula that does not use line 19 has an atomic head.

If you know Lisp, you can think of this feature as a sort of “implicit cons.” Where in Lisp you would write `(cons x y)`, in Nock you write `[x y]`.

For example,

    ~tasfyn-partyv> .*(42 [4 0 1])

where `42` is the subject (data) and `[4 0 1]` is the formula (code), happens to evaluate to `43`. Whereas

    ~tasfyn-partyv> .*(42 [3 0 1])

is `1`. So if we evaluate

    ~tasfyn-partyv> .*(42 [[4 0 1] [3 0 1]])

we get

    [43 1]

Except for the crash defaults (lines 6, 10, 17, and 35), we’ve actually completed all the essential aspects of Nock. The operators up through 5 provide all necessary computational functionality. Nock, though very simple, is actually much more complex than it formally needs to be.

Operators 6 through 10 are macros. They exist because Nock is not a toy, but a practical interpreter. Let’s see them all together:

Lines 28-33:
------------

    28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]
    29 ::    *[a 7 b c]        *[a 2 b 1 c]
    30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]
    31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]
    32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]
    33 ::    *[a 10 b c]       *[a c]

Whoa! Have we entered rocket-science territory? Let’s try to figure out what these strange formulas do - simplest first. The simplest is clearly line 33:

    33 ::    *[a 10 b c]       *[a c]

If `x` is an atom and `y` is a formula, the formula `[10 x y]` appears to be equivalent to… `y`. For instance:

    ~tasfyn-partyv> .*([132 19] [10 37 [4 0 3]])
    20

Why would we want to do this? `10` is actually a hint operator. The `37` in this example is discarded information - it is not used, formally, in the computation. It may help the interpreter compute the expression more efficiently, however.

Every Nock computes the same result - but not all at the same speed. What hints are supported? What do they do? Hints are a higher-level convention which do not, and should not, appear in the Nock spec. Some are defined in Hoon. Indeed, a naive Nock interpreter not optimized for Hoon will run Hoon quite poorly. When it gets the product, however, the product will be right.

There is another reduction for hints - line 32:

    32 ::    *[a 10 [b c] d]   *[a 8 c 7 [0 3] d]

Once we see what `7` and 8 do, we’ll see that this complex hint throws away an arbitrary `b`, but computes the formula `c` against the subject and… throws away the product. This formula is simply equivalent to `d`. Of course, in practice the product of `c` will be put to some sordid and useful use. It could even wind up as a side effect, though we try not to get that sordid.

(Why do we even care that `c` is computed? Because `c` could crash. A correct Nock cannot simply ignore it, and treat both variants of `10` as equivalent.)

We move on to the next simplest operator, 7. Line 29:

    29 ::    *[a 7 b c]        *[a 2 b 1 c]

Suppose we have two formulas, `b` and `c`. What is the formula `[7 b c]`? This example will show you:

    ~tasfyn-partyv> .*(42 [7 [4 0 1] [4 0 1]])
    44

`7` is an old mathematical friend, function composition. It’s easy to see how this is built out of `2`. The data to evaluate is simply `b`, and the formula is `c` quoted.

Line 30 looks very similar:

    30 ::    *[a 8 b c]        *[a 7 [[7 [0 1] b] 0 1] c]

Indeed, `8` is `7`, except that the subject for `c` is not simply the product of `b`, but the ordered pair of the product of `b` and the original subject. Hence:

    ~tasfyn-partyv> .*(42 [8 [4 0 1] [0 1]])
    [43 42]

and

    ~tasfyn-partyv> .*(42 [8 [4 0 1] [4 0 3]])
    43

Why would we want to do this? Imagine a higher-level language in which the programmer declares a variable. This language is likely to generate an `8`, because the variable is computed against the present subject, and used in a calculation which depends both on the original subject and the new variable.

For extra credit, explain why we can’t just define

    *[a 8 b c]        *[a 7 [b 0 1] c]

Another simple macro is line 31:

    31 ::    *[a 9 b c]        *[a 7 c 2 [0 1] 0 b]

`9` is a calling convention. With `c`, we produce a noun which contains both code and data - a core. We use this core as the subject, and apply the formula within it at slot `b`.

And finally, we come to the piece de resistance - line 28:

    28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]

Great giblets! WTF is this doing? It seems we’ve finally arrived at some real rocket science.

Actually, `6` is a primitive known to every programmer - good old “if.” If `b` evaluates to `0`, we produce `c`; if `b` evaluates to `1`, we produce `d`; otherwise, we crash.

For instance:

    ~tasfyn-partyv> .*(42 [6 [1 0] [4 0 1] [1 233]])
    43

and

    ~tasfyn-partyv> .*(42 [6 [1 1] [4 0 1] [1 233]])
    233

In real life, of course, the Nock implementor knows that `6` is “if” and implements it as such. There is no practical sense in reducing through this macro, or any of the others. We could have defined “if” as a built-in function, like increment - except that we can write “if” as a macro. If a funky macro.

It’s a good exercise, however, to peek inside the funk.

We can actually simplify the semantics of `6`, at the expense of breaking the system a little, by creating a macro that works as “if” only if `b` is a proper boolean and produces `0` or `1`. Perhaps we have a higher-level type system which checks this.

This simpler “if” would be:

    *[a 6 b c d]    *[a [2 [0 1] [2 [1 c d] [[1 0] [4 4 b]]]]]

Or without so many unnecessary brackets:

    *[a 6 b c d]    *[a 2 [0 1] 2 [1 c d] [1 0] [4 4 b]]

How does this work? We’ve replaced `[6 b c d]` with the formula `[2 [0 1] [2 [1 c d] [[1 0] [4 4 b]]]]`. We see two uses of `2`, our evaluation operator - an outer and an inner.

Call the inner one `i`. So we have `[2 [0 1] i]`. Which means that, to calculate our product, we use `[0 1]` - that is, the original subject - as the subject; and the product of `i` as the formula.

Okay, cool. So `i` is `[2 [1 c d] [[1 0] [4 4 b]]]`. We compute Nock with subject `[1 c d]`, formula `[[1 0] [4 4 b]]`.

Obviously, `[1 c d]` produces just `[c d]` - that is, the ordered pair of the “then” and “else” formulas. `[[1 0] [4 4 b]]` is a line 19 cell - its head is `[1 0]`, producing just `0`, its tail `[4 4 b]`, producing… what? Well, if `[4 b]` is `b` plus `1`, `[4 4 b]` is `b` plus `2`.

We’re assuming that `b` produces either `0` or `1`. So `[4 4 b]` yields either `2` or `3`. `[[1 0] [4 4 b]]` is either `[0 2]` or `[0 3]`. Applied to the subject `[c d]`, this gives us either `c` or `d` - the product of our inner evaluation `i`. This is applied to the original subject, and the result is “if.”

But we need the full power of the funk, because if `b` produces, say, `7`, all kinds of weirdness will result. We’d really like `6` to just crash if the test product is not a boolean. How can we accomplish this? This is an excellent way to prove to yourself that you understand Nock: figure out what the real `6` does. Or you could just agree that `6` is “if,” and move on.

(It’s worth noting that in practical, compiler-generated Nock, we never do anything as funky as these `6` macro internals. There’s no reason we couldn’t build formulas at runtime, but we have no reason to and we don’t - except when actually metaprogramming. As in most languages, normally code is code and data is data.)


"""
OP_FAS = 0
OP_CON = 1
OP_TAR = 2
OP_WUT = 3
OP_LUS = 4
OP_TIS = 5
OP_IF  = 6
OP_H07 = 7
OP_H08 = 8
OP_H09 = 9
OP_H10 = 10


def _tar(noun):
    """*[a, b] -- Reduce a Nock expression.

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
    """
    noun = _t(*noun)
    # Let's use `_fas` to carve up the noun, for practice.
    subj = _fas((2, noun))  # noun[0]
    op = _fas((6, noun))  # noun[1][0]
    obj = _fas((7, noun))  # noun[1][1]
    with _indent():
        if _wut(op) == YES:
            _d("<- 19 ::    *[a [b c] d]      [*[a b c] *[a d]]")
            with _indent():
                return (tar((subj, op)), tar((subj, obj)))
        else:
            if op == OP_FAS:
                _d("<- 21 ::    *[a 0 b]          /[b a]")
                return fas((obj, subj))

            elif op == OP_CON:
                _d("<- 22 ::    *[a 1 b]          b")
                return obj

            elif op == OP_TAR:
                _d("<- 23 ::    *[a 2 b c]        *[*[a b] *[a c]]")
                b = _fas((2, obj))
                c = _fas((3, obj))
                with _indent():
                    return tar((tar((subj, b)), tar((subj, c))))

            elif op == OP_WUT:
                _d("<- 24 ::    *[a 3 b]          ?*[a b]")
                return wut(tar((subj, obj)))

            elif op == OP_LUS:
                _d("<- 25 ::    *[a 4 b]          +*[a b]")
                return lus(tar((subj, obj)))

            elif op == OP_TIS:
                _d("<- 26 ::    *[a 5 b]          =*[a b]")
                return tis(tar((subj, obj)))

            elif op == OP_IF:
                _d("<- 28 ::    *[a 6 b c d]      *[a 2 [0 1] 2 [1 c d] [1 0] 2 [1 2 3] [1 0] 4 4 b]")
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
