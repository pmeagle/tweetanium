
/**
 * Tweetanium is released under the terms of the 
 * Apache Public License Version 2. 
 * Copyright (c) 2008 by Appcelerator, Inc.
 * http://tweetanium.com
 */

$MQL("l:app.compiled", function() {
	
	T.dragApp();
	
	var height = Titanium.UI.currentWindow.getHeight();
	var width = Titanium.UI.currentWindow.getWidth();
	
	Titanium.UI.currentWindow.setHeight(height + 125);
	Titanium.UI.currentWindow.setWidth(width - 175);	

	App.params = 
	{
		debug: 0                 /* set to 1 to turn on verbose logging, 2 to turn on only pub/sub logging */,
		delayCompile: false      /* generally don't touch this unless you really know why */
	};

	function queryString(uri,params)
	{
		idx = uri.indexOf('?');
		params = params || {};
		if (idx > 0)
		{
			var qs = uri.substring(idx+1);
			jQuery.each(qs.split('&'),function()
			{
				var e = this.split('=');
				var v = decodeURIComponent(e[1]||'');
				var k = decodeURIComponent(e[0]);
				switch(v)
				{
					case '1':
					case 'true':
					case 'yes':
					
						v = true;
						
					break;
					
					case '0':
					case 'false':
					case 'no':
					
						v = false;
						
					break;

				}
				params[k]=v;
			});
		}
		return params;
	}

	queryString(window.document.location.href, App.params);

	var rowTemplate = App.Wel.compileTemplate('' +
	'<div class="entry">' +
	'	<div class="top">' +
	'		<a target="ti:systembrowser" href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}">#{user.name}</a> <span>#{display_date} via #{source}</span>'+
	'	</div>'+
	'	<div class="icon" row_id="#{id}" style="height:48px;width:48px" >'+
	'		<a target="ti:systembrowser" href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}"><img src="#{user.profile_image_url}"/></a>'+
	'	</div>'+
	'	<div class="message message_#{id}">#{display_text}</div>'+
	'   <div class="action_menu action_menu_#{id}" style="display:none">' +
	'		<div class="action_menu_container">' +
	'			<div class="action reply active_action" name="#{user.screen_name}"><img src="images/main/reply_action.png"/><div>Reply</div></div>' +
	'			<div class="action_divider"></div>' + 
	'			<div class="action dm" name="#{user.screen_name}"><img src="images/main/dm_action.png"/><div>Direct Msg</div></div>' +
	'			<div class="action_divider"></div>' + 
	'			<div class="action retweet" name="#{user.screen_name}" row_id="#{id}"><img src="images/main/retweet_action.png"/><div>Re-tweet</div></div>'+
	'			<div class="action_divider"></div>' + 
	'			<div class="action favorite" tweet_id="#{id}"><img src="images/main/favorite_action.png"/><div>Favorite</div></div>'+
	'		</div>' +
	'	</div>' +
	'</div>');

	// DIRECT MESSAGE TEMPLATE
	var dmTemplate = App.Wel.compileTemplate(''+
	'<div class="entry">'+
	'	<div class="top">'+
	'		<a target="ti:systembrowser" href="http://twitter.com/#{sender.screen_name}" alt="Go to profile for #{sender.name}">#{sender.name}</a> <span>#{display_date}</span>'+
	'	</div>'+
	'	<div class="icon" row_id="#{id}" style="height:48px;width:48px" >'+
	'		<a target="ti:systembrowser" href="http://twitter.com/#{sender.screen_name}" alt="Go to profile for #{user.name}"><img src="#{sender.profile_image_url}"/></a>'+
	'	</div>'+
	'	<div class="message message_#{id}">#{display_text}</div>'+
	'   <div class="action_menu action_menu_#{id}" style="display:none">' +
	'		<div class="action_menu_container">' +
	'			<div class="action reply active_action" name="#{sender.screen_name}"><img src="images/main/reply_action.png"/><div>Reply</div></div>' +
	'			<div class="action_divider"></div>' + 
	'			<div class="action dm" name="#{sender.screen_name}"><img src="images/main/dm_action.png"/><div>Direct Msg</div></div>' +
	'			<div class="action_divider"></div>' + 
	'			<div class="action retweet" name="#{sender.screen_name}" row_id="#{id}"><img src="images/main/retweet_action.png"/><div>Re-tweet</div></div>'+
	'			<div class="action_divider"></div>' + 
	'			<div class="action favorite" tweet_id="#{id}"><img src="images/main/favorite_action.png"/><div>Favorite</div></div>'+
	'		</div>' +
	'	</div>' +
	'</div>');

	// user info		
	var username = App.params.u;
	var password = App.params.p;
	var remember = App.params.r;
	
	// sinceIds
	var sinceId = null;
	var repliesSinceId = null;
	var dmSinceId = null
	
	// vars for tweet data
	var currentTweets = null;
	var currentReplies= null;
	var currentDMs = null;

	// current page
	var currentTweetPage = 1;
	var currentRepliesPage = 1;
	var currentDMPage = 1;
	
	// number of pages
	var tweetPages =0;
	var repliesPages =0;
	var dmPages =0;
	
	// current page
	var currentTweetIndex =0;
	var currentRepliesIndex =0;
	var currentDMIndex = 0;

	// current tab
	var currentTab = "ALL";

	// sound vars
	var soundPlaying = false;
	var soundEnabled = true;		

	
	// data for time/date formatting
	var months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
	var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

	// initialize local DB

	var Tweetanium2 = {

		sql: 
		{
			main: 
			{
				createTweets: "create table if not exists Tweets (tweet text, id number, username text)",
				getTweet: "select id from Tweets where id = ?",
				loadTweets: "select tweet,id from Tweets where username = ? order by id DESC",
				saveTweet: "insert into Tweets values(?,?,?)",
				reTweet: "select tweet from Tweets where username = ? and id = ? order by id DESC",

				createReplies: "create table if not exists Replies (tweet text, id number, username text)",
				getReply: "select id from Replies where id = ?",
				loadReplies: "select tweet,id from Replies where username = ? order by id DESC",
				saveReply: "insert into Replies values(?,?,?)",
				reReply: "select tweet from Replies where username = ? and id = ? order by id DESC",
				
				createMessages: "create table if not exists DirectMessages (tweet text, id number, username text)",
				getMessage: "select id from DirectMessages where id = ?",				
				loadMessages: "select tweet,id from DirectMessages where username = ? order by id DESC",
				saveMessage: "insert into DirectMessages values(?,?,?)",
				reMessage: "select tweet from DirectMessages where username = ?  and id = ? order by id DESC",
				
				getSoundPref: "select sound_on from User where username = ?",
				setSound: "update User set sound_on = ? where username = ?"
			}
		},

		msgs:
		{
			main:
			{
				fileFailed: ""
			}
		},

		notification: Titanium.Notification.createNotification(window),

		Create: function()
		{
			if (window.openDatabase)
			{
		        Tweetanium2.db = openDatabase("tweetanium", "2.0", "Tweetanium 2", 200000);

		 		if (!Tweetanium2.db)
				{
		            alert(Tweetanium2.msgs.fileFailed);
					return;
				}
		    }
			else
			{
		        alert(Tweetanium2.msgs.databaseFailed);
				return;
			}

		    Tweetanium2.db.transaction(function(tx) 
			{
				tx.executeSql(Tweetanium2.sql.main.createTweets, [], function(tx, result) {});
				tx.executeSql(Tweetanium2.sql.main.createReplies, [], function(tx, result) {});
				tx.executeSql(Tweetanium2.sql.main.createMessages, [], function(tx, result) {});

				Tweetanium2.load.all();

			});
		}
	}

	Tweetanium2.load = { 
		
		all: function()
		{
			for(loadable in this)
			{
				if(loadable != "all")
				{
					this[loadable]();
				}
			}
		},

		//
		// Load local preferences...
		//

		preferences: function()
		{
		    Tweetanium2.db.transaction(function(tx) 
			{
				tx.executeSql(
				
					Tweetanium2.sql.main.getSoundPref, 
					[
						username
					], 
					function(tx, result) 
					{
						if(result.rows.length > 0)
						{
							var row = result.rows.item(0);
							var soundOn = parseInt(row['sound_on']);
						
							if (soundOn == 1)
							{
								soundEnabled = true;
								jQuery('.sound_off').hide();
								jQuery('.sound_on').show();
							}
							else
							{
								soundEnabled = false;
								jQuery('.sound_on').hide();	
								jQuery('.sound_off').show();
							}							
						}
					}
				);
			});			
		},

		//
		// Load Tweets from Remote...
		//

		remoteTweetData: function()
		{

			var content = jQuery('#content');

			if (remaining_tweets < 0)
			{
				jQuery('#status_msg').html('Rate limit exceeded');
				checkRateLimit(); // go check again
				return;
			}
			jQuery('#refresh').attr('src','images/main/refresh_bolt.png');

			// load All Tweets
			var url = (sinceId == null)?'http://twitter.com/statuses/friends_timeline.json?count=200':
					'http://twitter.com/statuses/friends_timeline.json?since_id='+sinceId;

			jQuery.ajax(
			{
				'username': username,
				'password': password,
				'url': url,
				'dataType': 'json',
				success: function(tweets,textStatus)
				{			
					content.empty();
					var now = new Date();
					var nextTweet = now.getTime() + interval;
					var msg = 'Updated: '+formatTime(now.getHours(),now.getMinutes())+' with '+tweets.length+' tweet'+(tweets.length>1?'s':'');
					var next = new Date();
					next.setTime(nextTweet);
					Titanium.API.debug('nextTime='+next+', interval='+interval+',next.getHours()='+next.getHours());
					msg+='. Next: '+formatTime(next.getHours(),next.getMinutes());
					jQuery('#status_msg').html(msg);

					Tweetanium2.db.transaction(function(tx) 
					{
						// store tweets in DB
						for (var c=0; c < tweets.length; c++)
						{
							if (c==0) { sinceId = tweets[c].id; }

							tweets[c].source = tweets[c].source.gsub('"', "'");

							(function() {
								
								var id = tweets[c].id;
								var tweet = swiss.toJSON(tweets[c]);
								
								tx.executeSql(

									Tweetanium2.sql.main.getTweet, 
									[
										id
									],
									function(tx, result)
									{
										if(result.rows.length < 1)
										{
											tx.executeSql(

												Tweetanium2.sql.main.saveTweet, 
												[
													tweet, 
													id,
													username
												], 
												function(tx, result)
												{
												}
											);
										}
									}
								);
							})();

							
						}
					});

					if (tweets.length > 0)
					{
						jQuery('.all_new_indicator').show();
					}

					// load latest and show
					Tweetanium2.load.localTweetData();
					remaining_tweets--;
					onNewTweets(tweets.length);
					resetInterval();

				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					resetInterval();
					startTimer();
				}
			});

			//
			// LOAD REPLIES...
			//

			jQuery('#replies_content').empty();
			var repliesURL = (repliesSinceId == null) ? 'http://twitter.com/statuses/replies.json' : 'http://twitter.com/statuses/replies.json?since_id=' + repliesSinceId;
			jQuery.ajax(
			{
				'username': username,
				'password': password,
				'url': repliesURL,
				'dataType': 'json',
				success: function(replies,textStatus)
				{
					Tweetanium2.db.transaction(function(tx) 
					{
						// store replies in DB
						for (var c=0;c<replies.length;c++)
						{
							if (c==0) { repliesSinceId = replies[c].id; }

							replies[c].source = replies[c].source.gsub('"', "'");

							(function() {

								var id = replies[c].id;
								var tweet = swiss.toJSON(replies[c]);

								tx.executeSql(

									Tweetanium2.sql.main.getReply, 
									[
										id
									],
									function(tx, result)
									{
										if(result.rows.length < 1)
										{
											tx.executeSql(

												Tweetanium2.sql.main.saveReply, 
												[
													tweet, 
													id,
													username
												], 
												function(tx, result)
												{
												}
											);
										}
									}
								);
							})();

						}
					});	
					if (replies.length > 0)
					{
						jQuery('.replies_new_indicator').show();
					}

					// load latest and show
					Tweetanium2.load.replies();			
				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					resetInterval();
					startTimer();
				}

			});

			//
			// LOAD DM's...
			//

			jQuery('#dm_content').empty();

			var dmURL = (repliesSinceId == null) ? 'http://twitter.com/direct_messages.json' : 'http://twitter.com/direct_messages.json?since_id=' + dmSinceId;
			
			jQuery.ajax(
			{
				'username': username,
				'password': password,
				'url': dmURL,
				'dataType': 'json',
				success: function(dms, textStatus)
				{
					Tweetanium2.db.transaction(function(tx) 
					{
						// store dms in DB
						for (var c=0;c<dms.length;c++)
						{
							if (c==0) { dmSinceId = dms[c].id; }

							(function() {

								var id = dms[c].id;
								var tweet = swiss.toJSON(dms[c]);

								tx.executeSql(

									Tweetanium2.sql.main.getMessage, 
									[
										id
									],
									function(tx, result)
									{
										if(result.rows.length < 1)
										{
											tx.executeSql(

												Tweetanium2.sql.main.saveMessage, 
												[
													tweet, 
													id,
													username
												], 
												function(tx, result)
												{
												}
											);
										}
									}
								);
							})();
						}

					});

					if (dms.length > 0)
					{
						jQuery('.dm_new_indicator').show();
					}

					// load latest and show
					Tweetanium2.load.messages();			

				},
				error: function(XMLHttpRequest, textStatus, errorThrown)
				{
					resetInterval();
					startTimer();
				}
			});

		},
		
		//
		// Load Tweets from DB...
		//
		
		localTweetData: function()
		{

		   Tweetanium2.db.transaction(function(tx) 
			{
				tx.executeSql(
				
					Tweetanium2.sql.main.loadTweets, 
					[
						username
					], 
					function(tx, result) 
					{
						var tweetArray = [];
						var count = 0;
						var content = jQuery('#content');

					
					 	for (var i = 0; i < result.rows.length; ++i) 
						{
							var row = result.rows.item(i);

							var json = eval('(' + row['tweet'] + ')');
							tweetArray[count] = json;

							// record since_id for new twitter updates
							if (count == 0) { sinceId = row['id']; }

							// only show first 4
							if (count < 4)
							{
								var html = rowTemplate(formatTweet(tweetArray[count]));
								content.append(html);							
							}

							count++;								
						}

						formatLinks(content);

						var length = (tweetArray.length>4) ? 4 : tweetArray.length;

						// initialize paging
						initTweetPaging(tweetArray);
						if (tweetArray.length == 0)
						{
							jQuery('.all_paging_text').html('No tweets found...');
							jQuery('.all_next_page').hide();
							jQuery('.all_prev_page').hide();
						}
						else
						{
							jQuery('.all_paging_text').html('Showing  1 - ' + length + ' of  ' + currentTweets.length);						
							jQuery('.all_prev_page').hide();
							
							if (tweetArray.length < 4)
							{
								jQuery('.all_next_page').hide();							
							}
							else
							{
								jQuery('.all_next_page').show();
							}
						}

						jQuery('#refresh').attr('src','images/main/refresh.png');

						// wire row entries for action overlay
						wireEntries();				

					}
				);
			});

		},
					
		//
		// Load Replies from DB
		//			
		
		replies: function()
		{
		    Tweetanium2.db.transaction(function(tx) 
			{
				tx.executeSql(
				
					Tweetanium2.sql.main.loadReplies, 
					[
						username
					], 
					function(tx, result) 
					{
						var tweetArray = [];
						var count = 0;
						var content = jQuery('#replies_content');							
						
					 	for (var i = 0; i < result.rows.length; ++i) 
						{
							var row = result.rows.item(i);
							var json = eval('(' + row['tweet'] + ')');
							tweetArray[count] = json;
							
							// record since_id for new twitter updates
							if (count == 0) { repliesSinceId = row['id']; }

							// only show first 4
							if (count < 4)
							{
								var html = rowTemplate(formatTweet(tweetArray[count]));
								content.append(html);							
							}
							
							count++;
						}
						
						formatLinks(content);

						var length = (tweetArray.length>4) ? 4 : tweetArray.length;

						// initialize paging
						initRepliesPaging(tweetArray);
						
						if (tweetArray.length == 0)
						{
							jQuery('.replies_paging_text').html('No replies found...');
							jQuery('.replies_next_page').hide();
							jQuery('.replies_prev_page').hide();
						}
						else
						{
							jQuery('.replies_paging_text').html('Showing  1 - ' + length + ' of  ' + currentReplies.length);						
							jQuery('.replies_prev_page').hide();
							
							if (tweetArray.length < 4)
							{
								jQuery('.replies_next_page').hide();							
							}
							else
							{
								jQuery('.replies_next_page').show();
							}
						}

						jQuery('#refresh').attr('src','images/main/refresh.png');

						// wire row entries
						wireEntries();			

					}
				);
			});
		},

		//
		// Load DirectMessages from DB
		//
		
		messages: function()
		{
		    Tweetanium2.db.transaction(function(tx) 
			{
				tx.executeSql(
				
					Tweetanium2.sql.main.loadMessages, 
					[
						username
					], 
					function(tx, result) 
					{
						var tweetArray = [];
						var count = 0;
						var content = jQuery('#dm_content');

					 	for (var i = 0; i < result.rows.length; ++i) 
						{
							var row = result.rows.item(i);
							var json = eval('(' + row['tweet'] + ')');
							tweetArray[count] = json;

							// record since_id for new twitter updates
							if (count == 0) { dmSinceId = row['id']; }

							if (count < 4)
							{
								var html = dmTemplate(formatTweet(tweetArray[count]));
								content.append(html);							
							}

							count++;

						}

						formatLinks(content);

						var length = (tweetArray.length>4) ? 4 : tweetArray.length;

						// initialize paging
						initDMPaging(tweetArray);
						
						if (tweetArray.length == 0)
						{
							jQuery('.dm_paging_text').html('No direct messages found...');
							jQuery('.dm_next_page').hide();
							jQuery('.dm_prev_page').hide();
						}
						else
						{
							jQuery('.dm_paging_text').html('Showing  1 - ' + length + ' of  ' + currentDMs.length);						
							jQuery('.dm_prev_page').hide();
							
							if (tweetArray.length < 4)
							{
								jQuery('.dm_next_page').hide();							
							}
							else
							{
								jQuery('.dm_next_page').show();
							}
						}

						jQuery('#refresh').attr('src', 'images/main/refresh.png');

						// wire row entries
						wireEntries();

					}
				);
			});
		}
	}

	Tweetanium2.Create();


	// initially check the rate and set it
	checkRateLimit();

	//
	//  Date Utility functions
	//
	
	function today(d)
	{
		var now = new Date();
		return d.getDay() == now.getDay() && 
		       d.getDate() == now.getDate() &&
			   d.getMonth() == now.getMonth();
	}
	
	function parseDate(d)
	{
		var parts = d.split(' ');
		var date = new Date();
		var time = parts[3].split(':');
		date.setUTCMonth(months[parts[1]]);
		date.setUTCDate(parts[2]);
		date.setUTCFullYear(parts[5]);
		date.setUTCHours(time[0]);
		date.setUTCMinutes(time[1]);
		date.setUTCSeconds(time[2]);
		return date;
	}
	
	function formatTime(h,m)
	{
		m = m < 10 ? '0'+m : m;
		var ampm = 'pm';
		if (h < 12) 
		{
			h = h < 1 ? 12 : h;
			ampm = 'am';
		}
		else
		{
			h = h - 12;
		}
		return h + ':' + m + ' ' + ampm;	
	}

	
	//
	// Formatting Utility functions
	//
	
	function linkURIs(tweet)
	{
		var uriRE = /((http[s]?):\/\/)([^:\/\s]+)((\/\w+)*\/)?([\w\-\.]+[^#?\s]+)?(.*)?(#[\w\-]+)?/;
		return tweet.gsub(uriRE, function(m)
		{
			return '<a target="ti:systembrowser" href="' + m[0] + '">' + m[0] + '</a>';
		})
	}

	function linkReplies(tweet)
	{
		var unRE = /(@[\w]+)/;
		return tweet.gsub(unRE,function(m)
		{
			// target ti:systembrowser will cause titanium to open the link in the systembrowser (doh!)
			return '<a target="ti:systembrowser" href="http://twitter.com/' + m[0].substring(1) + '">' + m[0] + '</a>';
		})
	}
	
	function formatTweet(obj)
	{
		var d = parseDate(obj.created_at);
		obj.display_date = formatTime(d.getHours(),d.getMinutes());
		if (!today(d))
		{
			obj.created_at = days[d.getDay()] + obj.created_at;
		}
		obj.display_text = linkReplies(linkURIs(obj.text));
		return obj;
	}
	
	function formatLinks(dom)
	{
		// ensure all embedding links open in the system browser instead of this window
		jQuery.each(jQuery(dom).find("a").not("[target]"),function()
		{
			jQuery(this).attr('target','ti:systembrowser');
		});
	}

	//
	// Formatting Utility functions
	//
	
	// HANDLE TAB CLICKS
	jQuery('.tab').bind("click", function()
	{
		jQuery('.tab').removeClass('active');
		jQuery(this).addClass('active');
	});

	// ALL TAB
	jQuery('.tab_all').bind("click", function()
	{
		jQuery('#content').show();
		jQuery('#replies_content').hide();
		jQuery('#dm_content').hide();
		jQuery('.dm_paging').hide();
		jQuery('.replies_paging').hide();
		jQuery('.all_paging').show();
		jQuery('.all_new_indicator').hide();
		
		currentTab = "ALL";
	});
	
	// DM TAB
	jQuery('.tab_dm').bind("click", function()
	{
		jQuery('#dm_content').show();		
		jQuery('#content').hide();
		jQuery('#replies_content').hide();
		jQuery('.replies_paging').hide();
		jQuery('.all_paging').hide();
		jQuery('.dm_paging').show();
		jQuery('.dm_new_indicator').hide();

		currentTab = "DM";
	});
	
	// REPLIES TAB
	jQuery('.tab_replies').bind("click", function()
	{
		jQuery('#replies_content').show();
		jQuery('#content').hide();
		jQuery('#dm_content').hide();		
		jQuery('.all_paging').hide();
		jQuery('.dm_paging').hide();
		jQuery('.replies_paging').show();
		jQuery('.replies_new_indicator').hide();

		currentTab = "REPLIES";
	});

	//
	// Init tweet paging
	//
	function initTweetPaging(tweets)
	{
		currentTweets = tweets;
		tweetPages = parseInt(tweets.length/4);
		tweetPages = (tweets.length%4 > 0)?tweetPages+1:tweetPages;
		currentTweetPage = 1;
		currentTweetIndex = 0;			
	};
	
	//
	// Init Replies paging
	//
	function initRepliesPaging(replies)
	{
		currentReplies = replies;
		repliesPages = parseInt(replies.length/4);
		repliesPages = (replies.length%4 > 0)?repliesPages+1:repliesPages;
		currentRepliesPage = 1;			
		currentRepliesIndex = 0;		
	};
	
	//
	// Init DM paging
	//
	function initDMPaging(dms)
	{
		currentDMs = dms;
		dmPages = parseInt(dms.length/4);
		dmPages = (dms.length%4 > 0)?dmPages+1:dmPages;
		currentDMPage = 1;		
		currentDMIndex = 0;				
	};
	
	//
	// Next Page Tweets
	//
	function nextTweetPage()
	{
		if (currentTweetPage< tweetPages)
		{
			currentTweetIndex = currentTweetIndex + 4;		
			var end = currentTweetIndex + 4;
			end = (end > currentTweets.length)?currentTweets.length:end;
			jQuery('#content').empty();
			currentTweetPage++;	
			setPageContent(currentTweetIndex,end);				
			jQuery('.all_prev_page').show();
			if (currentTweetPage == tweetPages)
			{
				jQuery('.all_next_page').hide();
			}
			else
			{
				jQuery('.all_next_page').show();
			}
		}
	}

	//
	// Prev Page Tweets
	//
	function prevTweetPage()
	{
		if (currentTweetPage > 1)
		{
			currentTweetIndex = currentTweetIndex - 4;		
			var end = currentTweetIndex + 4;
			jQuery('#content').empty();
			currentTweetPage--;	
			jQuery('.all_next_page').show();
			setPageContent(currentTweetIndex,end);	
			if (currentTweetPage == 1)
			{
				jQuery('.all_prev_page').hide()
			}
			else
			{
				jQuery('.all_prev_page').show();
			}

		}
	}

	//
	// Next Page Replies
	//
	function nextRepliesPage()
	{
		if (currentRepliesPage< repliesPages)
		{
			currentRepliesIndex = currentRepliesIndex + 4;		
			var end = currentRepliesIndex + 4;
			end = (end > currentReplies.length)?currentReplies.length:end;
			jQuery('#replies_content').empty();
			currentRepliesPage++;	
			setPageContent(currentRepliesIndex,end);			
			jQuery('.replies_prev_page').show();
			if (currentRepliesPage == repliesPages)
			{
				jQuery('.replies_next_page').hide();
			}
			else
			{
				jQuery('.replies_next_page').show();
			}
		}
	}

	//
	// Prev Page Replies
	//
	function prevRepliesPage()
	{
		if (currentRepliesPage > 1)
		{
			currentRepliesIndex = currentRepliesIndex - 4;		
			var end = currentRepliesIndex + 4;
			jQuery('#replies_content').empty();
			currentRepliesPage--;	
			jQuery('.replies_next_page').show();
			setPageContent(currentRepliesIndex,end);	
			if (currentRepliesPage == 1)
			{
				jQuery('.replies_prev_page').hide()
			}
			else
			{
				jQuery('.replies_prev_page').show();
			}
		}
	}

	//
	// Next Page DMs
	//
	function nextDMPage()
	{
		if (currentDMPage< dmPages)
		{
			currentDMIndex = currentDMIndex + 4;		
			var end = currentDMIndex + 4;
			end = (end > currentDMs.length)?currentDMs.length:end;
			jQuery('#dm_content').empty();
			currentDMPage++;	
			setPageContent(currentDMIndex,end);				
			jQuery('.dm_prev_page').show();
			if (currentDMPage == dmPages)
			{
				jQuery('.dm_next_page').hide();
			}
			else
			{
				jQuery('.dm_next_page').show();
			}
		}
	}

	//
	// Prev Page DMs
	//
	function prevDMPage()
	{
		if (currentDMPage > 1)
		{
			currentDMIndex = currentDMIndex - 4;		
			var end = currentDMIndex + 4;
			jQuery('#dm_content').empty();
			currentDMPage--;	
			jQuery('.dm_next_page').show();
			setPageContent(currentDMIndex,end);	
			if (currentDMPage == 1)
			{
				jQuery('.dm_prev_page').hide()
			}
			else
			{
				jQuery('.dm_prev_page').show();
			}
		}
	}


	//
	//  Change Page Contents
	//
	function setPageContent(start,end)
	{
		for (var i=start;i<end;i++)
		{
			try
			{
				switch (currentTab)
				{
					case "ALL":
					
						var html = rowTemplate(formatTweet(currentTweets[i]));						
						jQuery('#content').append(html);
						var endNum = ((end)> currentTweets.length)?currentTweets.length:(end);
						jQuery('.all_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentTweets.length);
					
					break;
					
					case "REPLIES":
					
						var html = rowTemplate(formatTweet(currentReplies[i]));						
						jQuery('#replies_content').append(html);
						var endNum = ((end)> currentReplies.length)?currentReplies.length:(end);
						jQuery('.replies_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentReplies.length);
					
					break;
					
					case "DM":
					
						var html = dmTemplate(formatTweet(currentDMs[i]));						
						jQuery('#dm_content').append(html);
						var endNum = ((end)> currentDMs.length)?currentDMs.length:(end);
						jQuery('.dm_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentDMs.length);
					
					break;
					
				}
			}
			catch(E)
			{
				//FIXME
			}
		}
		// wire row entries
		wireEntries();			
	}

	//
	// Home for "ALL" Tweets
	//
	jQuery('.home_link').bind("click", function()
	{
		switch(currentTab)
		{
			case 'ALL':
			
				currentTweetPage = 1;		
				currentTweetIndex = 0;				
				jQuery('#content').empty();
				if (currentTweets.length > 4)
				{
					jQuery('.all_next_page').show();						
				}
				else
				{
					jQuery('.all_next_page').hide();					
				}
				jQuery('.all_prev_page').hide()
			
			break;
			
			case 'REPLIES':
			
				currentRepliesPage = 1;		
				currentRepliesIndex = 0;				
				jQuery('#replies_content').empty();
				if (currentReplies.length > 4)
				{
					jQuery('.replies_next_page').show();						
				}
				else
				{
					jQuery('.replies_next_page').hide();					
				}
				jQuery('.replies_prev_page').hide()
			
			break;
			
			case 'DM':
			
				currentDMPage = 1;		
				currentDMIndex = 0;				
				jQuery('#dm_content').empty();
				if (currentDMs.length > 4)
				{
					jQuery('.dm_next_page').show();						
				}
				else
				{
					jQuery('.dm_next_page').hide();					
				}
				jQuery('.dm_prev_page').hide()
			
			break;
			
		}
		setPageContent(0,4);
	});
	
	//
	// Paging for "ALL" Tweets
	//
	jQuery('.next_page').bind("click", function()
	{
		switch(currentTab)
		{
			case 'ALL':
			
				nextTweetPage();
			
			break;
			
			case 'REPLIES':
			
				nextRepliesPage();
			
			break;
			
			case 'DM':
			
				nextDMPage();
			
			break;
			
		}
	});
	
	jQuery('.prev_page').bind("click", function()
	{
		switch(currentTab)
		{
			case 'ALL':
			
				prevTweetPage();
			break;
			
			case 'REPLIES':
			
				prevRepliesPage();
			break;
			
			case 'DM':
			
				prevDMPage();
			break;
			
		}
	});
	
	//
	// This function sets up the row listeners to show and 
	// handle entry-level actions (e.g., reply, DM, retweet and favorites)
	//
	function wireEntries()
	{
		// HANDLE DISPLAY/HIDING OF ACTION MENU
		jQuery('.icon').bind("mouseover", function()
		{
			var id = jQuery(this).attr('row_id');
			jQuery('.action_menu').hide();

			jQuery('.action_menu_' + id).show();
		});
		
		jQuery('.message').bind("mouseover", function()
		{
			jQuery('.action_menu').hide();
		});

		// SHOW HOVER EFFECT OVER ACTION ITEM
		jQuery('.action').bind("mouseover", function()
		{
			jQuery('.action').removeClass('active_action');
			jQuery(this).addClass('active_action');
		});

		// HANDLE ACTION CLICKS
		jQuery('.action').bind("click", function()
		{
			var textbox = jQuery('#tweettext');

			// HANDLE REPLY
			if (jQuery(this).hasClass('reply'))
			{
				textbox.val('@' + jQuery(this).attr('name') + ' ');
				var val = textbox.val().length;
				textbox[0].setSelectionRange(val,val)
				displayLength();
				return;
			}

			// HANDLE DIRECT MESSAGE
			if (jQuery(this).hasClass('dm'))
			{
				textbox.val('D '+jQuery(this).attr('name') + ' ');
				var val = textbox.val().length;
				textbox[0].setSelectionRange(val,val)
				displayLength();
				jQuery('#mode').val('DM')								
				jQuery('#target_user').val(jQuery(this).attr('name'))	
				return;							
			}

			// HANDLE RETWEET
			if (jQuery(this).hasClass('retweet'))
			{
				var sql = null;
				var message = null;
				var tweetId = jQuery(this).attr('row_id');
				
				switch(currentTab)
				{
					case 'ALL':
					
						sql = Tweetanium2.sql.main.reTweet;
					break;
				
					case 'REPLIES':
					
						sql = Tweetanium2.sql.main.reReply;
					break;
					
					case 'DM':
					
						sql = Tweetanium2.sql.main.reMessage;
					break;
					
				}
				
				Tweetanium2.db.transaction(function(tx) 
				{
					tx.executeSql(sql, [username, tweetId], function(tx, result) {
						
						var row = result.rows.item(0);
						var json = eval('(' + row['tweet'] + ')');
						message = json.text;

					});
				});

				// if null, pull from current tweet
				if (message == null)
				{
					message = jQuery('.message_' + tweetId).html();
				}
				textbox.val('RT @'+jQuery(this).attr('name')+': '+message+ ' ');
				var val = textbox.val().length;
				textbox[0].setSelectionRange(val,val)
				displayLength();	
				jQuery('#mode').val('RT');							
				return;
			}

			// HANDLE FAVORITE
			if (jQuery(this).hasClass('favorite'))
			{
				var tweetId = jQuery(this).attr('tweet_id');
				jQuery.ajax(
				{
					'username': username,
					'password': password,
					'type': 'POST', 
					'url': 'http://twitter.com/favorites/create/'+tweetId+'.json',
					'data': {'id':tweetId,'source':'tweetanium'},
					success: function(resp,textStatus)
					{
						jQuery('#tweettext').val('');
						displayLength();
						Tweetanium2.notification.setTitle('Favorite');
						Tweetanium2.notification.setMessage('Your favorite request was successful');
						Tweetanium2.notification.setIcon('app://images/notification.png');
						Tweetanium2.notification.show();
					},
					error: function(XMLHttpRequest, textStatus, errorThrown)
					{
						jQuery('#tweettext').val('');
						displayLength();
						Tweetanium2.notification.setTitle('Favorite');
						Tweetanium2.notification.setMessage('Only one favorite per tweet!');
						Tweetanium2.notification.setIcon('app://images/notification.png');
						Tweetanium2.notification.show();
					}
				});
				return;
			}
		});			
		
	}


	// wire up refresh button
	jQuery("#refresh").click(Tweetanium2.load.remoteTweetData).mouseover(function()
	{
		jQuery(this).attr('src','images/main/refresh_hover.png');
		
	}).mouseout(function()
	{
		
		jQuery(this).attr('src','images/main/refresh.png');
		
	});

			
	var remaining_tweets = 100;
	var reset_time_in_seconds = 0;
	var interval = 100000;
	var timer = 0;
	var firstTimeLoad = true;
	
	function startTimer()
	{
		if (timer)
		{
			clearTimeout(timer);
		}
		if (interval > 0)
		{
			timer = setTimeout(Tweetanium2.load.remoteTweetData,interval);
		}
	}

	//
	// setup sound handlers
	//
	function setSound(mode)
	{
		Tweetanium2.db.transaction(function(tx) 
		{
			tx.executeSql(

				Tweetanium2.sql.main.setSound, 
				[
					mode,
					username
				], 
				function(tx, result) 
				{
				}
			);
		});
	}
	
	// sound on
	jQuery('.sound_off').bind("click", function()
	{
		jQuery('.sound_off').hide();
		jQuery('.sound_on').show();
		soundEnabled = true;
		setSound(mode);			
	});
	
	// turn sound off
	jQuery('.sound_on').bind("click", function()
	{
		jQuery('.sound_on').hide();
		jQuery('.sound_off').show();
		soundEnabled = false;
		setSound(mode);
	});
	
	// play sound
	function playSound(path)
	{
		if (!soundEnabled) { return; } // if turned off, don't use it!
		if (soundPlaying) { return; } // just prevent in case we get into situation where we're playing already
		
		try
		{
			soundPlaying = true;
			var sound = Titanium.Media.createSound(path);
			sound.onComplete(function()
			{
				soundPlaying = false;
			})
			sound.play();
		}
		catch(E)
		{
			Titanium.API.debug('sound exception for '+path+', exception = '+E);
		}
	}
	
	
	function onNewTweets(count)
	{
		if (count > 0)
		{
			playSound('app://audio/New.mp3');

			try
			{
				var ps = count > 1 ? 's' : '';
				Tweetanium2.notification.setTitle('New Tweet'+ps+' received');
				Tweetanium2.notification.setMessage(count+' new tweet'+ps+' received');
				Tweetanium2.notification.setIcon('app://images/notification.png');
				Tweetanium2.notification.show();
			}
			catch(E)
			{
				alert("an error has occured: " + String(E));
			}
		}
	}
	
	function onStartup()
	{
		playSound('app://audio/On.mp3');
	}
	
	// we need to adjust our interval
	function resetInterval()
	{
		var minutes_left = 60 - new Date().getMinutes();
		interval = (remaining_tweets / minutes_left) * 60000;
		Titanium.API.debug('adjusting rate limit minutes remaining='+minutes_left+', interval='+interval+', remaining='+remaining_tweets);
		startTimer();
	}

	// determine the rate limit
	function checkRateLimit()
	{
		jQuery.ajax(
		{
			'username':username,
			'password':password,
			'url':'http://twitter.com/account/rate_limit_status.json',
			'dataType':'json',
			success:function(rate)
			{
				if (firstTimeLoad)
				{
					onStartup();
					firstTimeLoad = false;
				}
				var minutes_left = 60 - new Date().getMinutes();
				reset_time_in_seconds = rate.reset_time_in_seconds;
				remaining_tweets = rate.remaining_hits;
				resetInterval();
				Tweetanium2.load.remoteTweetData();
			}
		});
	}
	

	// create our tray area icon
	var trayIcon = "app://images/tray.png";
	if (Titanium.platform.toJSON == "win32") 
	{
		// in PR1, win32 doesn't support PNG directly
		trayIcon = "app://images/tray.ico";
	}

    var menu = Titanium.UI.createTrayMenu(trayIcon,null,function(sysmenu)
    {
	   // just toggle our visibility
       if (Titanium.window.isVisible())
       {
          Titanium.window.hide();
       }
       else
       {
          Titanium.window.show();
       }
    });

    	
	// in win32 we want to add an Exit menu to the tray
	if(Titanium.platform.toJSON == "win32")
	{
	    menu.addItem("Exit", function() 
	    {
	    	Titanium.UI.currentWindow.close();
	    });
	}

	function displayLength(e)
	{
		var count = jQuery("#tweettext").val().length;
		jQuery('#tweetcount').html(140-count);
		if (count > 0)
		{
			jQuery("#go").removeAttr('disabled');
		}
		else
		{
			jQuery("#go").attr('disabled','true');
		}
	}

	function calcLength(e)
	{
		var tweet = jQuery('#tweettext').val();
		var count = tweet.length;
		var len = 140 - (count + 1); // we add once since the new key isn't yet counted
		if (len < 0 && e.keyCode!=8) // allow backspace!
		{
			e.preventDefault();
			Titanium.Media.beep();
			return false;
		}
		if (e.keyCode==13)
		{
			if (len > 1 && jQuery.trim(tweet))
			{
				// this is for those power tweeters like scoble
				jQuery('#go').click();
			}
			e.preventDefault();
			return false;
		}
	}

	jQuery('#tweettext').keyup(displayLength);
	jQuery('#tweettext').keydown(calcLength);

	displayLength();
	
	var height = Titanium.UI.currentWindow.getHeight();

	jQuery('#shade').click(function()
	{
		if (jQuery('#shade').hasClass('open'))
		{
			jQuery('#shade').attr('class','')
			jQuery('#top').css('display','');
			Titanium.UI.currentWindow.setHeight(height);
		}
		else
		{
			jQuery('#shade').attr('class','open');
			jQuery('#top').css('display','none');
			Titanium.UI.currentWindow.setHeight(height-145);
		}
	});
	
	jQuery('#go').click(function()
	{
		var tweet = jQuery('#tweettext').val().gsub('\n','');
		var mode = jQuery('#mode').val();
		
		if (mode == 'NORMAL')
		{
			jQuery.ajax(
			{
				'username':username,
				'password':password,
				'type':'POST', 
				'url':'http://twitter.com/statuses/update.json',
				'data':{'status':tweet, 'source':'tweetanium'},
				success:function(resp,textStatus)
				{
					jQuery('#tweettext').val('');
					displayLength();
					Tweetanium2.load.remoteTweetData();
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					alert('textStatus='+textStatus+',error='+errorThrown);
					Tweetanium2.notification.setTitle('Update');
					Tweetanium2.notification.setMessage('Sorry there was an error from Twitter!');
					Tweetanium2.notification.setIcon('app://images/notification.png');
					Tweetanium2.notification.show();
				}
			});
		}
		// DIRECT MESSAGE
		else if (mode == 'DM')
		{
			var user = jQuery('#target_user').val();
			jQuery.ajax(
			{
				'username':username,
				'password':password,
				'type':'POST', 
				'url':'http://twitter.com/direct_messages/new.json',
				'data':{'text':tweet, 'user':user, 'source': 'tweetanium'},
				success:function(resp,textStatus)
				{
					jQuery('#tweettext').val('');
					displayLength();
					Tweetanium2.notification.setTitle('Direct Message');
					Tweetanium2.notification.setMessage('Your message has been sent');
					Tweetanium2.notification.setIcon('app://images/notification.png');
					Tweetanium2.notification.show();
					
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					Tweetanium2.notification.setTitle('Direct Message');
					Tweetanium2.notification.setMessage('Sorry there was an error from Twitter!');
					Tweetanium2.notification.setIcon('app://images/notification.png');
					Tweetanium2.notification.show();
				}
			});
		}
		
		// RESET MODE
		jQuery('#mode').val('NORMAL');
	});
	
	// set our draggable region to the top 140px of our frame
	/* Titanium.Extras.setDraggableRegionHandler(function(target,x,y)
	{
		return y < 80;
	}); */
	
	// just focus the initial textarea on load
	setTimeout(function(){
		jQuery("#tweettext").focus();	
	},1000);


});

