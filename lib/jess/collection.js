var Q = require('q');
var lingo = require('lingo');
var cloneextend = require('cloneextend');
var cheerio = require('cheerio');
var queryString = require('querystring');
var markdown = require( "markdown" ).markdown;
        
module.exports = function(collection) {
    this.variables = [];
    this.methods = [];
    
    this.name = lingo.camelcase( collection.name.replace(/[^a-zA-z0-9]/g, " ").toLowerCase() );
    this.description = "This library was generated from Postman by Jess";
    this.version = collection.version;
    this.timestamp = collection.timestamp;

    var thisClass = this;
    
    var methodTemplate = require(__dirname + '/collection/method');
    var parameterTemplate = require(__dirname + '/collection/parameter');
    collection.requests.forEach(function(methodInCollection, index) {
       var method = cloneextend.clone( methodTemplate );

        var variables = methodInCollection.url.match(/\{\{(.*?)\}\}/g);
        for (var i in variables) {
            var variable = variables[i];
            if (thisClass.variables.indexOf(variable) == -1)
                thisClass.variables.push(variable);
        }

       method.parse(methodInCollection);
       if (methodInCollection.data.length > 0) {
           if (methodInCollection.dataMode && methodInCollection.dataMode == "raw") {
               // @deprecated Parse raw input params (old versions of postman)
              method.rawMethodParams = methodInCollection.data;
           } else {
               // @deprecated Build param list from data attributes (old versions of postman)
               for (var i in methodInCollection.data) {
                    var parameter = cloneextend.clone( parameterTemplate );
                    parameter.name = methodInCollection.data[i].key;
                    // @todo All param are strings (other types not yet supported in Postman)
                    parameter.type = "string";
                    method.parameters.push(parameter);
                }
            }
        }

        // Uses the the FIRST UL list to determin the params
        // (subsequent lists in the comments are okay - they are ignored)
        var descriptionAsHtml = markdown.toHTML(method.description);
        var $ = cheerio.load(descriptionAsHtml);
        var paramsFound  = false
        if (method.parameters.length > 0)
            paramsFound == true;
        $('ul').first().children('li').each(function(index, element) {
            var line = $(element).text().trim().split(" ");
            var parameterName = line[0].replace(/(:|-)$/, '').trim();

            for (var i in method.parameters) {
                var parameter = method.parameters[i];
                if (parameterName == parameter.name) {
                    var description = line;
                    description.shift();
                    description = description.join(" ").replace(/^(:|-)/, '').trim();
                    description = description.replace(/(\r|\n)/mg, " ");
                    method.parameters[i].description = description;
                }
            }
            
            if (paramsFound == false) {
                var description = line;
                description.shift();
                description = description.join(" ").replace(/^(:|-)/, '').trim();
                description = description.replace(/(\r|\n)/mg, " ");
                
                var parameter = cloneextend.clone( parameterTemplate );
                parameter.name = parameterName;
                parameter.type = "string";
                parameter.description = description;
                method.parameters.push(parameter);
            }
        });

        if (methodInCollection.url.indexOf("?") > -1) {
            var queryParams = queryString.parse(methodInCollection.url.replace(/^.*\?/, ''));
            for (var queryParam in queryParams) {
                var parameter = cloneextend.clone( parameterTemplate );
                parameter.name = queryParam;
                //@todo All params are strings (other types not yet supported in Postman)
                parameter.type = "string";
                if (typeof queryParams[queryParam] == 'string'
                    && queryParams[queryParam].match(/\{\{(.*?)\}\}/g)) {
                    parameter.value = queryParams[queryParam];
                }
                var paramExists = false;
                for (var i in method.parameters) {
                    if (parameter.name == method.parameters[i].name)
                        paramExists = true;
                }
                if (paramExists === false)
                    method.parameters.push(parameter);
            }
        }

        this.methods.push(method);
    });
    
    return this;
}