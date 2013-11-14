=====
Nock!
=====

If you don't know what Nock is, go `here`_ and keep reading.

.. _here: http://urbit.org

This is an implementation of Nock in JavaScript.  It borrows from `this python implementation`_, which is worth checking out.  This implementation is for pedagogic purposes, i.e. to let people play around with Nock and see how it works.  It's not intended to power a browser-based Arvo implementation, although if someone wants to take this and make that happen, that would be pretty awesome.

.. _this python implementation: https://github.com/eykd/nock

====
Usage
====
Despite being JavaScript, this has no web-based interface.  Instead, it runs
using `node.js`_.  Run repl.js like so:

.. _node.js: http://nodejs.org

node repl.js

nock.js features a parser, so enter regular ol' nock code and it will perform
its reductions until it either comes up with a solution or crashes.  Try
entering some samples from `Chapter 2`_ of the Urbit documentation and
following along.

.. _Chapter 2: http://www.urbit.org/2013/08/22/Chapter-2-nock.html

====
TODO
====

Two important notes:

This is not working 100%.  Specifically, I can't get the reduction from line 30
to work, the "function composition using an ordered pair", and the decrement
function from `Chapter 2`_ of the Urbit documentation causes all heck to break loose.  I think this has something to do with how I'm setting up brackets.  

.. _Chapter 2: http://www.urbit.org/2013/08/22/Chapter-2-nock.html

I would like to create a web-based REPL and haven't quite gotten around to it.  Perhaps someone with more brains, experience and/or free time could take a swing at that.  The world would be a much better place if you did.
