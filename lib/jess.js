var Q = require('q');
var request = require('request');
var cheerio = require('cheerio');
var linewrap = require('linewrap');
var lingo = require('lingo');

function jess() {
    
    this.getCollection = function(collectionId) {
        var deferred = Q.defer();

        var url = 'https://www.getpostman.com/collections/'+collectionId;
        
        // Get all bills currently before parliament from the RSS feed
        request(url, function (error, response, body) {
            // Handle errors gracefully
            try {
                var json = JSON.parse(body);
                deferred.resolve(json);
            } catch (exception) {
                deferred.resolve(null);
            }
        });
        return deferred.promise;
    };
    
    this.collectionToJavaScript = function(collection) {
        var parentClass = this;
        
        var javascript = '';
        
        javascript += "(function($) {\n\n";
        var libraryName = lingo.camelcase(collection.name.toLowerCase());
        javascript += "    "+libraryName+" = new function() {\n\n";
        
        collection.requests.forEach(function(method, index) {
            
            var methodUrl = method.url.replace(/\?(.*)$/g, '');
            var methodName = lingo.camelcase(method.name.toLowerCase());

            // Just use the first part of the description (before any HTML tags)
            var wrap;
            var description = method.description.replace(/\<(.*)/mg, "");
            description = description.replace(/(\r|\n)/mg, "");
            // Line wrap the description and format for insertion into docblock
            wrap = linewrap(69, {lineBreak: '\n         * ' /*, other options */});
            description = wrap(description);
            
            // Get from list in docblock
            var params = [];
            var arguments = [];

            if (method.data.length > 0) {
                // Ideally build param list from data attributes
                for (var i in method.data) {
                    var paramName = method.data[i].key;
                    
                    var argumentName = lingo.camelcase( paramName.toLowerCase().replace(/[_-]/, " ") );            
                    if (parentClass.isReservedKeyword(argumentName))
                        argumentName = "_"+argumentName;
                
                    var argumentDescription = method.data[i].type;
            
                    params.push( { name: paramName, argumentName: argumentName, description: argumentDescription});
                }
            } else {
                // Fallback: If no data property, try parsing description
                params = parentClass.getParamsFromDescription(method.description);
            }

            for (var i in params ) {
                arguments.push(params[i].argumentName);
            }
            
            javascript += "        /**\n";
            javascript += "         * Usage: "+libraryName+"."+methodName+"( arguments )\n";
            if (description) {
                javascript += "         * \n";
                javascript += "         * "+description+"\n";
            }
            if (params.length > 0) {
                javascript += "         * \n";
                for (var i in params ) {
                    javascript += "         * "+params[i].argumentName+"\t"+params[i].description+"\n";
                }
            }
            javascript += "         */\n";
            javascript += "        this."+methodName+" = function("+arguments.join(', ')+") {\n";
            javascript += "             var result;\n";
            javascript += "             $.ajax({\n";
            javascript += "                      async: false,\n";
            javascript += "                      type: \""+method.method+"\",\n";
            javascript += "                      url: \""+methodUrl+"\",\n";
            if (params.length > 0) {
                javascript += "                      data: {";
                for (var i in params) {
                    if (i > 0)
                        javascript += ", ";
                    
                    javascript += "\n                          \""+params[i].name+"\": "+params[i].argumentName;
                }
                javascript += "\n                      },\n";
            }
            javascript += "                      success: function(response) {\n";
            javascript += "                          result = response;\n";
            javascript += "                      },\n";
            javascript += "                      'error': function(jqXHR, textStatus, errorThrown) {\n";
            javascript += "                          /* @todo add error handling here */\n";
            javascript += "                      }\n";
            javascript += "              });\n";
            javascript += "              return result;\n";
            javascript += "        };\n\n";
        });
        
        javascript += "    };\n\n";
        javascript += "}( jQuery ));";

        return javascript;
    };
    
    this.getParamsFromDescription = function(description) {
        var parentClass = this;
        var params = [];
        var $ = cheerio.load(description);
        // Uses the the FIRST UL list to determin the params
        // (subsequent lists in the comments are okay - they are ignored)
        $('ul').first().children('li').each(function(i, e) {
            //var deferred = Q.defer();
            var line = $(e).text().trim().split(" ");
            var paramName = line[0];
            paramName = paramName.replace(/[^a-zA-z0-9_-]/g, "");
            
            var argumentName = lingo.camelcase( paramName.toLowerCase().replace(/[_-]/, " ") );            
            if (parentClass.isReservedKeyword(argumentName))
                argumentName = "_"+argumentName;
                
            var argumentDescription = line;
            argumentDescription.shift();
            argumentDescription = argumentDescription.join(" ").replace(/^:/, '').trim();
            
            params.push( { name: paramName, argumentName: argumentName, description: argumentDescription});
        });
        return params;
    };
    
    this.isReservedKeyword = function(string) {
        var reservedWords = ["break", "case", "catch", "class", "continue",
        "debugger", "default", "delete", "do", "else", "finally", "for",
        "function", "if", "in", "instanceof", "new", "return", "switch"];
        
        for (var j=0; j<reservedWords.length; j++) {
            if (reservedWords[j].match(string))
                return true;
        }
        return false;
    }
}

exports = module.exports = new jess();
exports.countries = jess;