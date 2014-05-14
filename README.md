jess - a companion for postman
====

#About Jess

Jess converts Postman API collections to client libraries with documentation.

It's intended for use with Postman from http://www.getpostman.com

Jess parses the collection objects exposed by getpostman.com - including the 
markdown uses for comments and environment variables - and generates client 
libraries complete with inline documentation.

Currently it only generates JavaScript libraries (that leverage jQuery). The 
intention is to extend this over time to other languages, standalone 
documentation and demos.

You can find Jess running at http://getjess.com

Note: Jess is not associated with Postman.

#Hints and tips

##Collection, method and argument names

Jess automatically generates safe method and argument names from collections.

It works best with collections created with the latest version of Postman, but 
older versions are supported too.

##Method descriptions

The current version of Postman uses Markdown for comments, and this is what Jess
expects (older versions allowed HTML, which is no longer supported).

Jess will display your comments in line above the method they are for, but it
has special handling for lists - these are parsed for parameter descriptions but
are not displayed as inline documentation.

###Adding descriptions for parameters

If you have a parameter called "argument_name" you can format a list with a 
description of the argument like this, and Jess will find it and use it to 
generate correctly formatted inline documentation.

    * argument_name description of parameter

Note: All parameters in Postman are of type "string" - this is a limitation in 
Postman, which does not currently support specifying other types for parameters.

##Environment variables

If you are using environment variables in a collection be use to mark them up in 
the form {{variable}} (i.e. using double braces) which is what Postman expects.

For example, if your hostname and API Key options for your service are set 
using environment variables, use the following markup for your URLs and specify
values for the "host" and "apiKey" environment variables in Postman:

    {{host}}/api-path/method-name/?apiKey={{apiKey}}

If you this, Jess will recognise them as environment variables and create an 
"options" object where they can be specified. These values will then be used
when invoking any methods that refernce these variables (along with any method
specific arguments).

e.g.

    yourLibrary.options.host = "http://api.example.com/api/";
    yourLibrary.options.apiKey = "ABC123";
    yourLibrary.yourMethod();

##Tweaking for performance

When generating JavaScript libraries jess currently generates methods that use 
asynchronous (blocking) rest calls so they can be easily consumed.

If you are creating your own library from a collection, you might wish to 
customise the library to use callbacks or event triggers instead.

Future versions of Jess may generate methods that support callbacks or event 
triggers by default.
