Gopher, Gemini, Spartan, Titan Proxy
====================================

A webproxy which you can host yourself and use like a Gemini client.

Features
--------

* gopher, gemini, spartan protocol support to varying degree
* hyphenations!
* favicons
* `----` horizontal line / "thematic separator" support
* "up" and "top" (root of the capsule) buttons
* tabs, history, cache are provided by your browser
* work as "proxy" for a single gemini capsule

Currently lacking features
--------------------------

* only most common gopher selectors supported (0,1,7,I,h)
* spartan input not supported
* error messages not explained well enough

Future plans
------------

* proper input for spartan
* better handling of "fake address bar" input
* force cache of favicons (so F5 wouldn't refetch them)
* inline images

Security note
-------------

Note that currently certificates not checked in any way, and client certificates are also not implemented.

Target browsers
---------------

At the moment, only latest Firefox and Chrome are tested. More browsers are possible to add if someone is going to use it.

Installation
------------

If you have docker:

	git clone ...
	cd ggstproxy
	docker build -t ggstproxy build
	sh ./start.sh

Otherwise:

1. Clone the repo

	git clone ...
	cd ggstproxy

2. You likely will need to change shebangs to something more advanced than plain sh (I tested it only with busybox ash):

	sed -i '1s/sh/bash/' html/cgi-bin/*.sh

3. Start the web server, pointing its document root to the directory with index.html file. In case of lighttpd:

	sed "/document-root/s_\".*\"_\"$PWD/data/html\"_" data/lighttpd.conf
	lighttpd -D -f $PWD/data/lighttpd.conf

4. Open http://localhost:8000/ in your browser.

If everything went well, you should be redirected to http://localhost:8000/gemini/alexey.shpakovsky.ru/startpage.gmi and see a startpage with a bunch of links and search bars.

