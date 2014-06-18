var EXPORTED_SYMBOLS = ["prompts"];
 
var prompts = {
  
  get service() {
    if (!this._service)
      this._service = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                .getService(Components.interfaces.nsIPromptService);
    
    return this._service;
  },
   
  alert: function(aTitle, aText) {
    this.service.alert(null, aTitle, aText);
  },
  
};
