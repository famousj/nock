=====
Nock!
=====

This is an implementation of Nock in JavaScript. If you don't know what Nock is, go `urbit.org`_.  Read some 
documentation.  Then request a destroyer, run :chat, and then say hello to everyone.  Your
humble author might well be online (~nosryl-tarpem).  Let him know if you find any bugs.

.. _urbit.org: http://www.urbit.org/2013/11/18/urbit-is-easy-ch1.html

This implementation is for pedagogic purposes, i.e. to let people 
play around with Nock and see how it works.  It's not intended to power a browser-based Arvo implementation, although 
if someone wants to take this and make that happen, that would be pretty awesome.

====
Usage
====
Despite being JavaScript, this project has no web-based interface.  Instead, it runs
using `node.js`_.  Run repl.js like so:

.. _node.js: http://nodejs.org

    node repl.js

nock.js features a parser, so enter nock pseudocode at the prompt and it will perform
its reductions until it either comes up with a solution or crashes.  Try
entering some samples from the `Urbit documentation`_ and
following along.

.. _Urbit documentation: http://www.urbit.org/2013/11/18/urbit-is-easy-ch2.html

There's also a one-line command evaluator, called oneliner.js, which you can run like so:
    
    node oneliner.js *[42 0 1]
    
This will evaluate the given command and then exit, which is useful if you want to redirect
stdout.  And really who doesn't?

`Brian Zick`_ has written a web-based REPL, which you can check out `here`_.)

.. _Brian Zick: http://zickzickzick.com
.. _here: http://zickzickzick.com/nock.js/nock.htm


====
Strict Mode
====

The interpreter has two modes.  Strict mode (the default) hews as closely as possible to the
`Nock spec`_.  You can disable strict mode and use pre-reduced functions, which speeds things up quite
a bit.  Disable strict mode by entering "strict=off" at the command prompt.

.. _Nock spec: http://www.cafepress.com/cp/customize/product2.aspx?from=CustomDesigner&number=1230382214

Here are the pre-reduced versions of the commands, for your reference.  Most of these are described in detail
in `Chapter 3`_ of the documentation:

.. _Chapter 3: http://www.urbit.org/doc/2013/11/18/ch3/

    Nock 6:
    32r ::   *[a 6 b c d]               *[a *[[c d] [0 *[[2 3] [0 ++*[a b]]]]]]
    
    Nock 7:
    33r ::  *[a 7 b c]                      *[*[a b]  c]
    
    Nock 8:
    34r :: *[a 8 b c] *[[*[a b] a] c]
    
    Nock 9:
    35r :: *[a 9 b c] *[*[a c] *[*[a c] 0 b]]
    
    Nock 10:
    36r ::    *[a 10 [b c] d]   *[*[[*[a c] a] 0 3] d]
    37r ::    *[a 10 b c]       *[a c]
