var linewrap = require('linewrap');
var lingo = require('lingo');
var moment = require('moment');
var cheerio = require('cheerio');

module.exports = new function() {
    
    /**
     * Takes a jess collection object and returns it as a JavaScript library.
     * @param   collection  object      A jess collection object
     * @return  string
     */
    this.convert = function( collection ) {
        var thisClass = this;

        collection.methods.forEach(function(method, index) {
            method.arguments = [];
            for (var i in method.parameters) {
                var parameter = method.parameters[i];
                // Convert parameter to JS save parameter name
                var argument = lingo.camelcase( parameter.name.replace(/[^a-zA-z0-9]/g, " ").toLowerCase() );
                
                // If parameter name is a reserved word then prefix with _
                if (thisClass.isReservedKeyword(argument))
                    argument = "_"+argument;

                method.parameters[i].argumentName = argument;
                method.arguments.push( argument );
            }
        });
        
        var javascript = "/**\n";
        javascript += " * @name\t"+collection.name+"\n";
        javascript += " * @date\t"+moment().format('MMMM Do YYYY, h:mm:ss a')+"\n";
        javascript += " *\n";
        javascript += " * Note: This library requires jQuery\n";
        javascript += " *\n";
        javascript += " * @example\n"
        javascript += " *\n";
        javascript += " * This library provides the following methods:\n *\n";
        collection.methods.forEach(function(method, index) {
            javascript += " *\t"+collection.name+"."+method.name+"("+method.arguments.join(", ")+")\n";
        });
        javascript += " *\n";
        
        javascript += " */\n";
        javascript += "var "+collection.name+" = new function() {\n\n";


       if (collection.variables.length > 0) {
            javascript += thisClass.indent(1)+"/**\n";
            javascript += thisClass.indent(1)+" * You need to configure these options to use this library\n";
            javascript += thisClass.indent(1)+" */\n";
            javascript += thisClass.indent(1)+"this.options = {\n";
            for (var i in collection.variables) {
                if (i > 0)
                    javascript += ",\n";
                var optionName = collection.variables[i].replace(/({{|}})/g, '"');
                javascript += thisClass.indent(2)+optionName+":\t\"\"";
            }
            javascript += "\n"+thisClass.indent(1)+"};\n\n";
       }
        
        collection.methods.forEach(function(method, index) {
            
            javascript += thisClass.indent(1)+"/**\n";
            if (method.description != "") {

                var description = method.description;
                description = description.replace(/(\n|\r)+/mg, "");
                // If appears to contain HTML strip everthing after first <
                // Descriptions are challenging to format presentably due to
                // the way it tends to be used it in practice, so choosing to
                // opt to just display the first line.
                description = description.replace(/\<(.*)/mg, "");
                // description =  cheerio.load(description)('*').text().trim();

                // Line wrap the description & format for insertion
                var wrap = linewrap(69, { lineBreak: "\n"+thisClass.indent(1)+" * " });
                description = wrap( description );
                
                if (description.length > 0) {
                    javascript += thisClass.indent(1)+" * @description\n"
                    javascript += thisClass.indent(1)+" *\n";
                    javascript += thisClass.indent(1)+" * "+description+"\n";
                    javascript += thisClass.indent(1)+" *\n";
                }
            }

            javascript += thisClass.indent(1)+" * @version\t"+method.version+"\n";
            if (method.timestamp != '')
                javascript += thisClass.indent(1)+" * @date\t"+moment(method.timestamp).format('MMMM Do YYYY, h:mm:ss a')+"\n";

            javascript += thisClass.indent(1)+" *\n";
            
            if (method.parameters.length > 0) {
                for (var i in method.parameters) {
                    var parameter = method.parameters[i];
                    javascript += thisClass.indent(1)+" * @param\t";
                    if (parameter.type != "")
                        javascript += "{"+parameter.type+"}\t";

                    var parameterDescription = parameter.description;
                    // var wrap = linewrap(69, { lineBreak: "\n"+thisClass.indent(2)+" *\t\t\t" });
                    // parameterDescription = wrap(parameterDescription);

                    javascript += parameter.argumentName+"\t"+parameterDescription+"\n";
                }
            }
            
            javascript += thisClass.indent(1)+" *\n";
            javascript += thisClass.indent(1)+" * @example\tvar response = "+collection.name+"."+method.name+"(argument1, argument2, ...);\n";
            javascript += thisClass.indent(1)+" */\n";
            javascript += thisClass.indent(1)+"this."+method.name+" = function("+method.arguments.join(", ")+") {\n";
            
            javascript += thisClass.indent(2)+"var result;\n";
            javascript += thisClass.indent(2)+"$.ajax({\n";
            javascript += thisClass.indent(3)+"async:\tfalse,\n";
            javascript += thisClass.indent(3)+"type:\t\""+method.type+"\",\n";
            
            var url = method.url;
            for (var i in collection.variables) {
                var optionName = collection.variables[i].replace(/({{|}})/g, '');
                url  = url.replace("{{"+optionName+"}}", '"+this.options["'+optionName+'"]+"');
            }
            url = "\""+url+"\"";
            url = url.replace(/\"\"\+/g, '');
            javascript += thisClass.indent(3)+"url:\t"+url+",\n";
            
            
            if (method.parameters.length > 0) {
                javascript += thisClass.indent(3)+"data:\t{\n";
                for (var i in method.parameters) {
                    var parameter = method.parameters[i];
                    if (i > 0)
                        javascript += ",\n";
                        
                    javascript += thisClass.indent(4)+"\""+parameter.name+"\": "+parameter.argumentName;
                }
                javascript += "\n"+thisClass.indent(3)+"},\n";
            }
            javascript += thisClass.indent(3)+"success:\tfunction(response) {\n";
            javascript += thisClass.indent(3)+"    result = response;\n";
            javascript += thisClass.indent(3)+"},\n";
            javascript += thisClass.indent(3)+"'error':\tfunction(jqXHR, textStatus, errorThrown) {\n";
            javascript += thisClass.indent(3)+"    /* @todo add error handling here */\n";
            javascript += thisClass.indent(3)+"}\n";
            javascript += thisClass.indent(2)+"});\n";
            
            javascript += thisClass.indent(2)+"return result;\n";
            
            javascript += thisClass.indent(1)+"};\n\n";
        });
        
        javascript += "};\n";
        
        return javascript;
    }
    
    /**
     * Checks if the supplied string is a reserved word in JavaScript
     * @param   string
     * @return  bool    Returns true if the string is a reserved word
     */
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
    
    this.indent = function ( indentLevel ) {
        if (!indentLevel) 
            indentLevel = 1;

        var text = '';
        for (var i = 0; i < indentLevel; i++) {
            text += "  ";
        }
        return text;
    }

}