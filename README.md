# This project is archived and no longer maintained

> I went to give special thanks to [@antgiant](https://github.com/antgiant) for managing this repository in its later years, anyone who contributed to the library, and all of our users.  I started TwitterLib as a general purpose library after having created a few Twitter bots that used Apps Script code created by [@labnol](https://github.com/labnol), in order to quickly spin up new bots when a new idea sparked.  It became the underpinning of most of my projects thereafter, and it was always neat to find out when others were also using it.  A series of successive actions on Twitter's part ended my desire to make more bots, then to continue my existing ones, then to post to the service altogether.  Now the v1 endpoint used by this library is no longer accessible to non-Enterprise tier developers, so this library is effectively unusable in its current state, and is archived with no plans to make a new v2 or OAuth2-based version.

-@airhadoken

# Twitter Lib for Google Apps Script

This library provides easy Twitter API (OAuth 1.0a Only) integration for Google Apps Script.  It's based on a modified version of [Google's OAuth1](https://github.com/googlesamples/apps-script-oauth1) library, and adds convenience functions for Twitter's OAuth 1.0a API endpoints and tighter properties integrations.

# Use

*In Classic Code Editor*
Go to Resources -> Libraries in the Script menus, 
paste in `MKvHYYdYA4G5JJHj7hxIcoh8V4oX7X1M_` (the project key for this script),
and add in Twitterlib, version 25 (the most recent).  

*In New Code Editor*
Click the + after Libraries, paste in `11dB74uW9VLpgvy1Ax3eBZ8J7as0ZrGtx4BPw7RKK-JQXyAJHBx98pY-7` (the project key for this script),
and add in Twitterlib, select version 25 (the most recent).  

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

