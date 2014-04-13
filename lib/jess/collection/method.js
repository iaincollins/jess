var lingo = require('lingo');

module.exports = new function() {
    this.name = "";
    this.url = "";
    this.type = "GET";
    this.parameters = [];
    this.rawMethodParams = "";
    this.description = "";
    this.version = "";
    this.timestamp =  "";

    this.parse = function(method) {
        this.name = lingo.camelcase( method.name.replace(/[^a-zA-z0-9]/g, " ").toLowerCase() );
        this.url = method.url.replace(/\?(.*)$/g, '');
        this.description = method.description;
        this.version = method.version;
        this.timestamp = method.time;
        return this;
    };
}