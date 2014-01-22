=====
Nock!
=====

If you don't know what Nock is, go `here`_.  Request a destroyer, run :chat,
and then say hello.

.. _here: http://www.urbit.org/2013/11/18/urbit-is-easy-ch1.html

This is an implementation of Nock in JavaScript.  This implementation is for pedagogic purposes, i.e. to let people play around with Nock and see how it works.  It's not intended to power a browser-based Arvo implementation, although if someone wants to take this and make that happen, that would be pretty awesome.

====
Usage
====
Despite being JavaScript, this has no web-based interface.  Instead, it runs
using `node.js`_.  Run repl.js like so:

.. _node.js: http://nodejs.org

node repl.js

nock.js features a parser, so enter regular ol' nock code and it will perform
its reductions until it either comes up with a solution or crashes.  Try
entering some samples from the `Urbit documentation`_ and
following along.

.. _Urbit documentation: http://www.urbit.org/2013/11/18/urbit-is-easy-ch2.html

====
Notes
====

Two important notes:

There is not (yet) a canonical set of Nock test code.  So while I did my best 
to exercise all the pieces here, I might have missed something.  If something 
is amiss, feel free to let me know.

Also, there's a web-based REPL `here`_, which is using an old, buggy version of
nock.js, though hopefully it'll be using a new, spiffy version of nock.js
shortly.  If you don't want to deal with node.js, take a look there.

.. _here: https://github.com/anoxic/nock.js
