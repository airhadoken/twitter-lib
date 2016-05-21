/**
Twitter lib (C) 2014-2016 Bradley Momberger
Released under the MIT License https://opensource.org/licenses/MIT

The TransientProperties class provides the Properties interface over
an object that does not touch the Properties service, nor does it retain
the properties set in it in a store between uses (that is, when the thread
exits, the property store ceases to exist).

The main use of TransientProperties is when doing one-step OAuth, providing within the code
both the keys and the access tokens.  Since values can be set as part of the code, it is not
necessary to touch the PropertiesService (and incur the hits against usage limits
therein) to retrieve them.

Because the PropertiesService object is sealed, it is not possible
to create a PropertiesService.getTransientProperties() function, so
usage is restricted to new Twitterlib.TransientProperties().

Optionally, an object with which to seed the properties object can be
passed as argument to to the TransientProperties constructor.
**/
(function(global) {
  var TransientProperties = function(props) {
    this.data_ = {};
    if(props && typeof props === "object") {
      this.setProperties(props);
    }
    return this;
  };

  TransientProperties.prototype.getProperties = function() {
    return _.extend({}, this.data_);
  };
  
  TransientProperties.prototype.getProperty = function(key) {
    return this.data_[key];
  };
  
  TransientProperties.prototype.setProperties = function(props, deleteAllOthers) {
    if(deleteAllOthers) {
      this.data_ = _.extend({}, props);
    } else {
      _.extend(this.data_, props);
    }
    return this;
  }
  
  TransientProperties.prototype.setProperty = function(key, prop) {
    this.data_[key] = prop;
    return this;
  }
  
  TransientProperties.prototype.deleteAllProperties =  function() {
    this.data_ = {};
    return this;
  }

  TransientProperties.prototype.deleteProperty =  function(key) {
    delete this.data_[key];
    return this;
  }
  
  TransientProperties.prototype.getKeys = function() {
    return Object.keys(this.data_);
  }
  
  global.TransientProperties = TransientProperties;
  global.MemoryProperties = TransientProperties;
})(this);
