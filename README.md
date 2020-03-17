# Twitter Lib for Google Apps Script

This library provides easy Twitter API integration for Google Apps Script.  It's based on a modified version of [Google's OAuth1](https://github.com/googlesamples/apps-script-oauth1) library, and adds convenience functions for Twitter's API endpoints and tighter properties integrations.

# Use

Go to Resources -> Libraries in the Script menus, 
paste in `MKvHYYdYA4G5JJHj7hxIcoh8V4oX7X1M_` (the project key for this script),
and add in Twitterlib, version 25 (the most recent).  

If you haven't generated (or can't generate) an access token pair for your Twitter app yet,
paste this code into your script as well:

```javascript
function authCallback(request) {
  var OAuthConfig = new Twitterlib.OAuth(PropertiesService.getScriptProperties());
  OAuthConfig.handleCallback(request);
}
```

To create a Twitter-authorized OAuth1 instance, use this code:
```javascript
var oauth = new Twitterlib.OAuth(PropertiesService.getScriptProperties());
```

By convention, Twitter Lib looks for the following keys in your properties to set up authorization:

|key name|description|
|--------|--------------|
|TWITTER\_CONSUMER\_KEY|The Consumer Key for your Twitter App (this is the same for every user)|
|TWITTER\_CONSUMER\_SECRET|The Consumer Secret for your Twitter App (this is the same for every user)|
|TWITTER\_ACCESS\_TOKEN|The Public part of an Access Token for your Twitter App (this is different for every user)|
|TWITTER\_ACCESS\_SECRET|The Secret part of an Access Token for your Twitter App (this is different for every user)|

