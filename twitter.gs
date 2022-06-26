/**
Twitter lib (C) 2014-2016 Bradley Momberger
Released under the MIT License https://opensource.org/licenses/MIT

Get started with your Twitter based project easily, by importing this lib into your
Google Apps Script project.

Go to Resources -> Libraries in the Script menus, 
paste in MKvHYYdYA4G5JJHj7hxIcoh8V4oX7X1M_ (the project key for this script),
and add in Twitterlib, whatever version is most recent.  

Starting with version 12 of Twitter lib, you need to paste this function into your code
unless you have generated and set the access tokens for your Twitter app manually:

function authCallback(request) {
  var OAuthConfig = new Twitterlib.OAuth(PropertiesService.getScriptProperties());
  OAuthConfig.handleCallback(request);
}

To make a TWitter-authorized OAuth1 instance, just do:
new Twitterlib.OAuth(PropertiesService.getScriptProperties());

If your script properties already contain the proper consumer keys and access tokens,
you don't need to do anything else.  You're ready to get started!  fetchTweets, sendTweet, etc.
*/

/**
* This class represents Twitter OAuth.  From here the fetchTweet, searchTweets, uploadMedia, retweet, or favorite
* functions can be called after setting up authorization, either directly with setAccessToken and setAccessTokenSecret,
* or through an authorization flow over email or popped up from the containing document.
*
* @return {Twitterlib.OAuth} Twitter-customized instance of OAuth1
*/
this._ = Underscore.load();

function OAuth(properties) {
  this.setAccessTokenUrl('https://api.twitter.com/oauth/access_token')
      .setRequestTokenUrl('https://api.twitter.com/oauth/request_token')
      .setAuthorizationUrl('https://api.twitter.com/oauth/authorize')
      .setCallbackFunction('authCallback')
      .setScriptId(ScriptApp.getScriptId());
  
  if(properties) {
    this.setPropertyStore(properties); 
  }
  
  try {
    DocumentApp.getUi();
    this.container = "document";
  } catch(e) {
    try {
      SpreadsheetApp.getUi();
      this.container = "spreadsheet";
    } catch(e) {
      try {
        FormApp.getUi();
        this.container = "form";
      } catch(e) {
        this.container = "standalone";
      }
    }
  }
    
  return this; 
}

OAuth.prototype = /*OAuth1.createService*/ new Service_("twitter");

/** Internal function that syncs properties with values in the twitter lib instance. */
OAuth.prototype.storeSpecialValue = function(key, value) {
  if(this.propertyCache_ && this.propertyStore_ && !this.propertyCache_[key]) {
    this.propertyStore_.setProperty(key, value);
    this.propertyCache_[key] = value;
  }
}

/**
* Set the access token public part for one-step Twitter API access.
*
* @param {string} accessToken the access token string for the user and app from Twitter's API
* @return {OAuth} the OAuth service for chaining
*/
OAuth.prototype.setAccessToken = function(accessToken) {
  var t;
  this.accessToken_ = accessToken;
  if(this.propertyStore_) {
    t = this.getToken_();
    if(!t) {
      t = {type: "access"};
    }
    t.public = accessToken;
    this.saveToken_(t);
  }
  this.storeSpecialValue("TWITTER_ACCESS_TOKEN", accessToken);
  return this;
}

/**
* Set the access token secret part for one-step Twitter API access.
*
* @param {string} accessTokenSecret the access token secret string for the user and app from Twitter's API
* @return {OAuth} the OAuth service for chaining
*/
OAuth.prototype.setAccessTokenSecret = function(accessTokenSecret) {
  var t;
  this.accessTokenSecret_ = accessTokenSecret;
  if(this.propertyStore_) {
    t = this.getToken_();
    if(!t) {
      t = {type: "access"};
    }
    t.secret = accessTokenSecret;
    this.saveToken_(t);
  }
  this.storeSpecialValue("TWITTER_ACCESS_SECRET", accessTokenSecret);
  return this;  
}

/**
* Wrapper around OAuth1 Service_.prorotype.setConsumerKey
*
* @param {string} consumerKey the consumer key string for the app from Twitter's API
* @return {OAuth} the OAuth service for chaining
*/
OAuth.prototype.setConsumerKey = function(consumerKey) {
  OAuth.prototype.constructor.prototype.setConsumerKey.apply(this, arguments);
  this.storeSpecialValue("TWITTER_CONSUMER_KEY", consumerKey);
  return this;
}

/**
* Wrapper around OAuth1 Service_.prorotype.setConsumerSecret
*
* @param {string} consumerSecret the consumer secret string for the app from Twitter's API
* @return {OAuth} the OAuth service for chaining
*/
OAuth.prototype.setConsumerSecret = function(consumerSecret) {
  OAuth.prototype.constructor.prototype.setConsumerSecret.apply(this, arguments);
  this.storeSpecialValue("TWITTER_CONSUMER_SECRET", consumerSecret);
  return this;
}

/**
* Wrapper around OAuth1 Service_.prorotype.setPropertyStore which takes in settings
* from the property store if they exist, and stores the special keys out to the property
* store for values which have already been set
*
* @param {Properties} store the property store to use for storing the OAuth token
* @return {OAuth} the OAuth service for chaining
*/
OAuth.prototype.setPropertyStore = function(store) {
  var t, that = this;
  OAuth.prototype.constructor.prototype.setPropertyStore.apply(this, arguments);
  var props = this.propertyCache_ = store.getProperties();
  
  [["TWITTER_CONSUMER_KEY", "consumerKey"],
   ["TWITTER_CONSUMER_SECRET", "consumerSecret"],
   ["TWITTER_ACCESS_TOKEN", "accessToken"],
   ["TWITTER_ACCESS_SECRET", "accessTokenSecret"]
  ].forEach(function(keys) {
    if(props[keys[0]] && !that[keys[1] + "_"]){
      that["set" + keys[1][0].toUpperCase() + keys[1].slice(1)](props[keys[0]]);
    }
    if(!props[keys[0]] && that[keys[1] + "_"]){
      props[keys[0]] = that[keys[1] + "_"];
    }
  });
  store.setProperties(props);
  if(this.accessToken_ && this.accessTokenSecret_) {
    t = this.getToken_();
    if(!t) {
      t = {type: "access"};
    }
    t.public = this.accessToken_;
    t.secret = this.accessTokenSecret_;
    this.saveToken_(t);
  }
  return this;
}

/**
* Get an image as an blob by URL.  This is an ancilliary function not related to interacting with
* the Twitter API.
*
* @param {string} image_url the URL of the image fetch
* @param {optional string} mime_type the type of image being fetched, default is "image/jpeg"
* @return {Blob} the image data as a Blob
*/
function grabImage(image_url, mime_type) {
  return UrlFetchApp.fetch(image_url).getAs(mime_type || "image/jpeg");
}
OAuth.prototype.grabImage = grabImage;

/**
* Upload a single image to Twitter and retrieve the media ID for later use in 
* sendTweet() (using the media_id_string params)
*
* @param {Blob} imageblob the Blob object representing the image data to upload
* @param {optional String} alt_text the alt text associated with the image
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.uploadMedia = function(imageblob, alt_text) {

  var url = "https://upload.twitter.com/1.1/media/upload.json";
  var alt_text_url = "https://upload.twitter.com/1.1/media/metadata/create.json"
  var old_location = this.paramLocation_;
  var media_result, media_json, alt_text_result; 
  var options = {
    method: "POST",
    payload: { "media" : imageblob }
  };
  
  this.checkAccess();
  
  this.paramLocation_ = "uri-query";
  
  try {
    media_result = this.fetch(url, options);
    Logger.log("Upload media success. Response was:\n" + media_result.getContentText() + "\n\n");
    media_json = JSON.parse(media_result.getContentText("UTF-8"));
    if(alt_text) {
      this.paramLocation_ = old_location;
      alt_text_result = this.fetch(
        alt_text_url, 
        { method: "POST",
         contentType: "application/json",
         payload: JSON.stringify({ media_id: media_json.media_id_string, alt_text: { text: alt_text } })
        });
      Logger.log("Upload alt text success. Response was:\n" + alt_text_result.getContentText() + "\n\n");
    }
    return media_json;
  } catch (e) {
    options.payload = options.payload && options.payload.length > 100 ? "<truncated>" : options.payload;
    Logger.log("Upload media failed. Error was:\n" + e + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof media_result !== 'undefined')?"\n\nmedia_result was:\n" + media_result:"") + ((typeof alt_text_result !== 'undefined')?"\n\nalt_text_result was:\n" + alt_text_result:"") + "\n\n");
    return null;
  } finally {
    this.paramLocation_ = old_location;
  }
    
}

/**
* Initiate a file upload session. Returns an object with a media_id attribute which should be used 
* to execute all subsequent requests. Use it in uploadMediaAppend and uploadMediaAppend uploadMediaFinalize methods.
*
* @param {Blob} mediablob the Blob object representing the file data to upload
*
* @param {String} media_category A string enum value which identifies a media usecase. This identifier is used
* to enforce usecase specific constraints (e.g. file size, video duration) and enable advanced features.	
*
* @param {optional String} additional_owners A comma-separated list of user IDs to set as additional owners allowed
* to use the returned media_id in Tweets or Cards. Up to 100 additional owners may be specified.		
*
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.uploadMediaInit = function(mediablob, media_category, additional_owners) {

  var url = "https://upload.twitter.com/1.1/media/upload.json";
  var old_location = this.paramLocation_;
  var media_result, media_json;

  let contentType = mediablob.getContentType();
  let size = mediablob.getBytes().length;

  var options = {
    method: "POST",
  };
  
  this.checkAccess();
  
  this.paramLocation_ = "auth-header";

  url = url + "?command=INIT&total_bytes=" + size + "&media_type=" + encodeURIComponent(contentType) + "&media_category=" + media_category;

  if(additional_owners) {
    url = url + "&additional_owners=" + additional_owners
  }
  
  try {
    media_result = this.fetch(url, options);
    Logger.log("Upload media INIT success. Response was:\n" + media_result.getContentText() + "\n\n");
    media_json = JSON.parse(media_result.getContentText("UTF-8"));
    
    return media_json;
  } catch (e) {
    Logger.log(e);
    options.payload = options.payload && options.payload.length > 100 ? "<truncated>" : options.payload;
    Logger.log("Upload media failed. Error was:\n" + JSON.stringify(e) + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof media_result !== 'undefined')?"\n\nmedia_result was:\n" + media_result:"") + "\n\n");
    return null;
  } finally {
    this.paramLocation_ = old_location;
  }
    
}

/**
* Upload a chunk (consecutive byte range) of the media file. For example, a 3 MB file could be split
* into 3 chunks of size 1 MB, and uploaded using 3 calls to the method. After the entire file is uploaded,
* the next step is to call the uploadMediaFinalize method.
*
* @param {Blob} mediablob the Blob object representing the file data to upload
* @param {String} media_id The media_id returned from the uploadMediaInit method.
* @param {Number} segment_index An ordered index of file chunk. It must be between 0-999 inclusive. The first
* segment has index 0, second segment has index 1, and so on.		
*
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.uploadMediaAppend = function(mediablob, media_id, segment_index) {

  var url = "https://upload.twitter.com/1.1/media/upload.json";
  var old_location = this.paramLocation_;
  var media_result; 

  var postData = '------xxxxxxxxxxxxxxxxxxxxx\r\nContent-Disposition: form-data; name=\"media_data\";filename=\"' +
  mediablob.getName() + '\"\r\nContent-Type: \"' + mediablob.getContentType() + '\"\r\n\r\n' + 
  Utilities.base64Encode(mediablob.getBytes()) + "\r\n------xxxxxxxxxxxxxxxxxxxxx--";

  var options = {
    method: "POST",
    payload: postData,
    contentType: "multipart/form-data; boundary=----xxxxxxxxxxxxxxxxxxxxx"
  };
  
  this.checkAccess();
  
  this.paramLocation_ = "auth-header";

  url = url + "?command=APPEND&media_id=" + media_id + "&segment_index=" + segment_index;
  
  try {
    media_result = this.fetch(url, options);
    Logger.log("Upload media APPEND success. Response code was: " + media_result.getResponseCode() + "\n\n");
    return media_result;
  } catch (e) {
    Logger.log(e);
    options.payload = options.payload && options.payload.length > 100 ? "<truncated>" : options.payload;
    Logger.log("Upload media failed. Error was:\n" + JSON.stringify(e) + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof media_result !== 'undefined')?"\n\nmedia_result was:\n" + media_result:"") + "\n\n");
    return null;
  } finally {
    this.paramLocation_ = old_location;
  }
}

/**
* This method should be called after the entire media file is uploaded using uploadMediaAppend method.
* If and (only if) the response of the uploadMediaFinalize command contains a processing_info field, 
* it may also be necessary to use uploadMediaStatus method and wait for it to return success before 
* proceeding to Tweet creation.
*
* @param {String} media_id The media_id returned from the uploadMediaInit method.
*		
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.uploadMediaFinalize = function(media_id) {

  var url = "https://upload.twitter.com/1.1/media/upload.json";
  var old_location = this.paramLocation_;
  var media_result, media_json; 

  var options = {
    method: "POST"
  };
  
  this.checkAccess();
  
  this.paramLocation_ = "auth-header";

  url = url + "?command=FINALIZE" + "&media_id=" + media_id;
  
  try {
    media_result = this.fetch(url, options);
    Logger.log("Upload media FINALIZE success. Response was:\n" + media_result.getContentText() + "\n\n");
    media_json = JSON.parse(media_result.getContentText("UTF-8"));
    return media_json;
  } catch (e) {
    Logger.log(e);
    options.payload = options.payload && options.payload.length > 100 ? "<truncated>" : options.payload;
    Logger.log("Upload media failed. Error was:\n" + JSON.stringify(e) + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof media_result !== 'undefined')?"\n\nmedia_result was:\n" + media_result:"") + "\n\n");
    return null;
  } finally {
    this.paramLocation_ = old_location;
  } 
}

/**
* This methodd is used to periodically poll for updates of media processing operation. After the uploadMediaStatus
* method response returns succeeded, you can move on to the next step which is usually create Tweet with media_id.
*
* @param {String} media_id The media_id returned from the uploadMediaInit method.
*		
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.uploadMediaStatus = function(media_id) {

  var url = "https://upload.twitter.com/1.1/media/upload.json";


  var old_location = this.paramLocation_;

  var options = {
    method: "GET"
  };
  
  this.checkAccess();
  
  this.paramLocation_ = "auth-header";

  url = url + "?command=STATUS&media_id=" + media_id;
  
  try {
    media_result = this.fetch(url, options);
    Logger.log("Upload media STATUS success. Response was:\n" + media_result.getContentText() + "\n\n");
    media_json = JSON.parse(media_result.getContentText("UTF-8"));
    return media_json;
  } catch (e) {
    Logger.log(e);
    options.payload = options.payload && options.payload.length > 100 ? "<truncated>" : options.payload;
    Logger.log("Upload media failed. Error was:\n" + JSON.stringify(e) + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof media_result !== 'undefined')?"\n\nmedia_result was:\n" + media_result:"") + "\n\n");
    return null;
  } finally {
    this.paramLocation_ = old_location;
  }
}

/**
* Kick off the authorization flow for when the OAuth instance doesn't yet have access tokens.
* For a document, spreadsheet, or form, this will spawn a popup window with a link for the user to click.
* For standalone, this will send an email to the user with the link.
* 
* This works with the authCallback template at the start of the docs to finish getting access tokens usable by the app.
* @return undefined
*/
OAuth.prototype.runAuthorizeFlow = function() {
  var url = this.authorize();
  var ui;
  switch(this.container) {
    case "document":
      ui = DocumentApp.getUi();
      break;
    case "spreadsheet":
      ui = SpreadsheetApp.getUi();
      break;
    case "form":
      ui = FormApp.getUi();
      break;
    default:
      ui = null;
  }
  var htmlbody = "<h2>Please authorize Twitter App with consumer key " + this.consumerKey_ + "</h2>"
                 + "<p>Twitter Lib for Google Apps Script needs you to click the link below to retrieve access tokens from Twitter.</p>"
                 + "<p>Once you have done this, no further action will be needed.</p>"
                 + "<p><a href=\"" + url + "\" target=\"_blank\">Click here</a></p>";
  
  if(ui) {
    htmlbody = HtmlService
   .createHtmlOutput(htmlbody)
     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
     .setWidth(600)
     .setHeight(500);
    
    ui.showModalDialog(htmlbody, '  ');
  } else {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: "Please authorize Twitter Lib to interact with Twitter",
      htmlBody: htmlbody
    });
  }
};

/**
* Mostly internal process used to ensure a connection to Twitter API can be made (access tokens exist)
* @return undefined
* @throws error if access is not granted
*/
OAuth.prototype.checkAccess = function() { 
  if(!this.hasAccess()) {
    throw "Access has not been granted.  Please call runAuthorizeFlow or setAccessToken and setAccessTokenSecret";
  }
}

/**
* Upload a tweet to Twitter with optional media.
*
* @param {string | Tweet} tweet the status text to send as a Twitter update
* @param {optional object} params any additional parameters to send as part of the update post
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.sendTweet = function(tweet, params, options) {
  var i;
  var payload = {
    "status" : (tweet.text || tweet)
  };
  if(params == null || params.decode !== false) {
    payload.status = payload.status
      .replace(/&(gt|lt|amp);/g, function(str, code) { 
        var lookup = {
          gt: ">",
          lt: "<",
          amp: "&"
        }
        return lookup[code];
      });
  }
  
  this.checkAccess();
  if(params) {
    delete params.decode;
    for(i in params) {
      if(params.hasOwnProperty(i)) {
        payload[i.toString()] = params[i];   
      }
    }
  }

  options = options || {};
  options.method = "POST";
  options.payload = payload;
  
  var status = "https://api.twitter.com/1.1/statuses/update.json";
  
  try {    
    var result = this.fetch(status, options);
    Logger.log("Send tweet success. Response was:\n" + result.getContentText("UTF-8") + "\n\n"); 
    return JSON.parse(result.getContentText("UTF-8"));
  } catch (e) {
    Logger.log("Send tweet failure. Error was:\n" + e + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof result !== 'undefined')?"\n\nresult was:\n" + result:"") + "\n\n");
    return null;
  }
    
}

/**
* Favorite a tweet by ID
*
* @param {string | Tweet} tweet ID of a Tweet, or a Tweet object
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.favorite = function(tweet) {
  var options = {
    method: "POST",
    payload: { id : tweet.id_str || tweet.id || tweet.toString() }
  };
  var url = "https://api.twitter.com/1.1/favorites/create.json";
  
  this.checkAccess();
  
  try {    
    var result = this.fetch(url, options);
    Logger.log("Tweet favorite success. Response was:\n" + result.getContentText() + "\n\n"); 
    return JSON.parse(result.getContentText("UTF-8"));
  } catch (e) {
    Logger.log("Tweet favorite failed. Error was:\n" + e + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof result !== 'undefined')?"\n\nresult was:\n" + result:"") + "\n\n");
    return false;
  }
    
}

/**
* Retweet a tweet to Twitter by ID
*
* @param {string | Tweet} tweet ID of a Tweet, or a Tweet object
* @return {object} the Twitter response as an object if successful, null otherwise
*/
OAuth.prototype.retweet = function(tweet) {
  var options = {
    method: "POST",
    payload: {}
  };
  
  var url = "https://api.twitter.com/1.1/statuses/retweet/" + (tweet.id_str || tweet.id || tweet.toString()) + ".json";
  
  this.checkAccess();
  
  try {    
    var result = this.fetch(url, options);
    Logger.log("Retweet success. Response was:\n" + result.getContentText() + "\n\n"); 
    return JSON.parse(result.getContentText("UTF-8"));
  } catch (e) {
    Logger.log("Retweet failed. Error was:\n" + e + "\n\noptions were:\n" + JSON.stringify(options) + ((typeof result !== 'undefined')?"\n\nresult was:\n" + result:"") + "\n\n");
    return false;
  }
    
}

/**
* Encode a string with URI components so as to avoid the errors with OAuth and certain characters
*
* @param {string} q the string to encode
* @return {string} the appropriately encoded string, with ()\[]!*' characters turned into %## forms
*/
function encodeString (q, lite) {
  
  // Update: 2014-06-05
  
  // Google Apps Script is having issues storing OAuth tokens with the Twitter API 1.1 due to some encoding issues.
  // Encode with URI component, escape parens/brackets/exclamation/tick/star, and also HTML-unescape the characters
  // that come in from the Twitter API escaped (greater than/less than/ampersand).
  // You can then send the tweet content in the payload on the POST request, but not on the URL.
  
  var str = encodeURIComponent(q
            .replace(/&(gt|lt|amp);/g, function(str, code) { 
              var lookup = {
                gt: ">",
                lt: "<",
                amp: "&"
              }
              return lookup[code];
            })).replace(/[()\[\]!*']/g, function(badchar) { 
             return "%" + badchar.charCodeAt(0).toString(16); 
           });
  
  if(lite) {
    // "Lite" mode encoding is for Twitter's query format rather than
    //  for just encoding strings to POST.  We definitely need to encode
    //  special-for-OAuth chars, but certain other punctuation is encoded
    //  where it shouldn't be.  The ones known to need to
    //  be unencoded are :, <space>, &, <comma>, /
    str = str.replace(/%(20|26|3A|2C|2F)/g, decodeURIComponent); 
  }
  
  return str;
}

/**
* Search Twitter for tweets which match the supplied search query, options, and tweet processor function.
*
* The options object can have these values:
* count, include_entities, result_type, since_id, max_id, until, filter, lang, locale, geocode.
*
* for more info see: https://dev.twitter.com/rest/reference/get/search/tweets
* 
* options can also have the property "multi".  When set to "true", more than one tweet will be returned as
*  an array, in reverse chronological order (newest first). No matching results will yield an empty array.
*  When multi is "false" or not supplied, the *oldest* tweet (matching the tweet_processor if supplied) will
*  be returned.  Without a matching tweet and with multi=false, fetchTwwets returns undefined.
* 
* @param {string} search the search string to send to the Twitter API ('lang:en' is attached as well)
* @param {optional function} tweet_processor a filter function for the returned tweets
* @param {options object} options a container object for 'since_id', 'count', and 'multi' options
* @return {object} the Twitter response as an object or array if successful, null otherwise
*/
OAuth.prototype.fetchTweets = function(search, tweet_processor, options) {

  var tweets, response, result = [], data, i, candidate, option_string, multi;  
  var phrase = encodeString(search, true);

  this.checkAccess();

  if(options == null) {
    options = {};
  }
  multi = options.multi == null ? false : options.multi;
  delete options.multi;
  delete options.callback;
  
  options = _.defaults(
    options, 
    { count: 5, 
      include_entities: "false", 
      result_type: "recent", 
      q: phrase 
    });
  
  option_string = _.reduce(options, function(str, val, key) {
    if(val != null && val !== "") {
      if(str.length > 0) {
        str += "&";
      }
      str += key + "=" + encodeString(val.toString());
    }
    return str;
  }, "");
  
  var url = [
    "https://api.twitter.com/1.1/search/tweets.json?",
    option_string
    ].join("");
  
  var request_options =
  {
    "method": "get"
  };
  
try {

    response = this.fetch(url, request_options);
    
    if (response.getResponseCode() === 200) {
      
      data = JSON.parse(response.getContentText());
      if (data) {
        
        tweets = data.statuses;
        
        if(!tweet_processor) {
          return multi ? tweets : tweets[tweets.length - 1];
        }
        for (i=tweets.length-1; i>=0; i--) {
          candidate = tweet_processor(tweets[i]);
          if(candidate === true) candidate = tweets[i];
          if(candidate) {
            if(multi) {
              result.unshift(candidate);
            } else {
              return candidate;
            }
          }
        }
        if(result.length) {
          return result;
        }
        if(i < 0) {
          Logger.log("No matching tweets this go-round");
        }
      }
    } else {
      Logger.log(response);
    }
  } catch (e) {
    Logger.log(e);
    throw e;
  }
  return result;
}

/** Get the length of URLs after Twitter shortens them to t.co links
@return {number} The character length of new Twitter t.co URLs
*/
OAuth.prototype.getShortUrlLength = function() {
  var endpoint = "https://api.twitter.com/1.1/help/configuration.json";

  this.checkAccess();
  
  try {
    var result = this.fetch(endpoint);
    
    var data = JSON.parse(result.getContentText());
    
    return data.short_url_length_https;
  } catch (e) {
    Logger.log(e);
    throw e;
  }
}
