var Q = require('q');
var request = require('request');
var lingo = require('lingo');

module.exports = new function() {
    
    /** 
     * Returns JSON object representing collection from getpostman.com
     */
    this.getCollection = function(collectionId) {
        var deferred = Q.defer();
        var response;
        
        collectionId = collectionId.replace(/[^a-zA-Z0-9]/gm, '');
        var url = 'https://www.getpostman.com/collections/'+collectionId;

        if (collectionId == '') {
            deferred.resolve(null);
            return deferred.promise;
        }

        try {
            request(url, function (error, response, body) {
                var collection = require(__dirname + '/jess/collection')( JSON.parse(body) );
                deferred.resolve(collection);
            });
            } catch (e) {
                deferred.resolve(null);
            }
        return deferred.promise;
    };
    
    this.convertCollection = function(collection, language) {
        var converter;
        switch(language) {
            case "javascript":
                 converter = require(__dirname + "/jess/convert/javascript");
                 break;
            default:
                return '';
        }
        var response = '';
        response = converter.convert(collection);
        return response;
    };

}