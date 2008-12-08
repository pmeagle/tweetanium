(function($)
{
	ti.ready(function()
	{
		var db = new ti.Database;
		db.open ('tweetanium')
		db.execute("create table if not exists Tweets (tweet blob, id number)");
		
		// vars for tweet data
		var currentTweets = null;
		var currentReplies= null;
		var currentDMs = null;

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
		
		// sinceId 
		var sinceId = null;
		
		//TODO: since, paging
		var username = AppC.params.u;
		var password = AppC.params.p;
		var remember = AppC.params.r;
		
		var months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
		var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		
		function today(d)
		{
			var now = new Date;
			return d.getDay() == now.getDay() && 
			       d.getDate() == now.getDate() &&
				   d.getMonth() == now.getMonth();
		}
		function parseDate(d)
		{
			var parts = d.split(' ');
			var date = new Date;
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
		var uriRE = /((http[s]?):\/\/)([^:\/\s]+)((\/\w+)*\/)?([\w\-\.]+[^#?\s]+)?(.*)?(#[\w\-]+)?/;
		function linkURIs(tweet)
		{
			return $.gsub(tweet,uriRE,function(m)
			{
				return '<a target="ti:systembrowser" href="' + m[0] + '">' + m[0] + '</a>';
			})
		}
		var unRE = /(@[\w]+)/;
		function linkReplies(tweet)
		{
			return $.gsub(tweet,unRE,function(m)
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

		var rowTemplate = AppC.compileTemplate(''+
		'<div class="entry">'+
		'	<div class="top">'+
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
		var dmTemplate = AppC.compileTemplate(''+
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
		
		var content = $('#content');

		// HANDLE TAB CLICKS
		$('.tab').click(function()
		{
			$('.tab').removeClass('active')
			$(this).addClass('active')
		});
		// ALL TAB
		$('.tab_all').click(function()
		{
			$('#content').show();
			$('#replies_content').hide();
			$('#dm_content').hide();
			$('.dm_paging').hide();
			$('.replies_paging').hide();
			$('.all_paging').show();
			
			currentTab = "ALL"		
		});
		
		// DM TAB
		$('.tab_dm').click(function()
		{
			$('#dm_content').show();		
			$('#content').hide();
			$('#replies_content').hide();
			$('.replies_paging').hide();
			$('.all_paging').hide();
			$('.dm_paging').show();

			currentTab = "DM";
		});
		
		// REPLIES TAB
		$('.tab_replies').click(function()
		{
			$('#replies_content').show();
			$('#content').hide();
			$('#dm_content').hide();		
			$('.all_paging').hide();
			$('.dm_paging').hide();
			$('.replies_paging').show();

			currentTab = "REPLIES"
		});
		

		//
		// MAIN LOADING FUNCTION - loads status updates, replies and DMs
		//
		function loadTweets()
		{
			if (remaining_tweets < 0)
			{
				$('#status_msg').html('Rate limit exceeded');
				checkRateLimit(); // go check again
				return;
			}
			$('#refresh').attr('src','images/main/refresh_bolt.png');
			
			var url = (sinceId == null)?'http://twitter.com/statuses/friends_timeline.json?count=200':
					'http://twitter.com/statuses/friends_timeline.json?since_id='+sinceId;
			$.ajax(
			{
				'username':username,
				'password':password,
				'url':url,
				'dataType':'json',
				success:function(tweets,textStatus)
				{
					content.empty();
					var now = new Date;
					//Last Updated:13:57 with 6 tweets / next update 13:59
					var nextTweet = now.getTime() + interval;
					var msg = 'Updated: '+formatTime(now.getHours(),now.getMinutes())+' with '+tweets.length+' tweet'+(tweets.length>1?'s':'');
					var next = new Date;
					next.setTime(nextTweet);
					ti.App.debug('nextTime='+next+', interval='+interval+',next.getHours()='+next.getHours());
					msg+='. Next: '+formatTime(next.getHours(),next.getMinutes());
					$('#status_msg').html(msg);
					
					var length = (tweets.length>4)?4:tweets.length;	
					initTweetPaging(tweets);
					for (var c=0;c<length;c++)
					{
						try
						{
							var html = rowTemplate(formatTweet(tweets[c]));
							content.append(html);
							
						}
						catch(E)
						{
							alert(E); //FIXME
						}
					}
					if (tweets.length == 0)
					{
						$('.all_paging_text').html('No tweets found...');
						$('.all_next_page').hide();
						$('.all_prev_page').hide();
					}
					else
					{
						$('.all_paging_text').html('Showing  1 - ' + length + ' of  ' + currentTweets.length);						
						$('.all_prev_page').hide();
						if (currentTweets.length < 4)
						{
							$('.all_next_page').hide();							
						}

					}
					
					remaining_tweets--;
					resetInterval();
					onNewTweets(tweets.length);
					$('#refresh').attr('src','images/main/refresh.png');

					// wire row entries
					wireEntries();

				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					//TODO
				}
			});

			//
			// LOAD REPLIES
			//
			$('#replies_content').empty();
			$.ajax(
			{
				'username':username,
				'password':password,
				'url':'http://twitter.com/statuses/replies.json',
				'dataType':'json',
				success:function(replies,textStatus)
				{
					var length = (replies.length > 4)?4:replies.length;
					initRepliesPaging(replies);
					for (var c=0;c<length;c++)
					{
						try
						{
							var html = rowTemplate(formatTweet(replies[c]));
							$('#replies_content').append(html);
						}
						catch(E)
						{
							alert(E); //FIXME
						}
					}
					if (replies.length == 0)
					{
						$('.replies_paging_text').html('No replies found...');
						$('.replies_next_page').hide();
						$('.replies_prev_page').hide();
					}
					else
					{
						$('.replies_paging_text').html('Showing  1 - ' + length + ' of  ' + replies.length);						
						$('.replies_prev_page').hide();
						if (currentReplies.length < 4)
						{
							$('.replies_next_page').hide();							
						}

					}
					
					// wire row entries
					wireEntries();
					
				}
			});
			
			//
			// LOAD DM's
			//
			$('#dm_content').empty();
			$.ajax(
			{
				'username':username,
				'password':password,
				'url':'http://twitter.com/direct_messages.json',
				'dataType':'json',
				success:function(dms,textStatus)
				{
					initDMPaging(dms);
					var length = (dms.length > 4)?4:dms.length;
					for (var c=0;c<length;c++)
					{
						try
						{
							var html = dmTemplate(formatTweet(dms[c]));
							$('#dm_content').append(html);
						}
						catch(E)
						{
							alert(E); //FIXME
						}
					}

					if (dms.length == 0)
					{
						$('.dm_paging_text').html('No DMs found...');
						$('.dm_next_page').hide();
						$('.dm_prev_page').hide();
					}
					else
					{
						$('.dm_paging_text').html('Showing  1 - ' + length + ' of  ' + dms.length);						
						$('.dm_prev_page').hide();
						if (currentDMs.length < 4)
						{
							$('.dm_next_page').hide();							
						}
					}

					// wire row entries
					wireEntries();
				}
			});



		}

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
				$('#content').empty();
				currentTweetPage++;	
				setPageContent(currentTweetIndex,end);				
				$('.all_prev_page').show();
				if (currentTweetPage == tweetPages)
				{
					$('.all_next_page').hide();
				}
				else
				{
					$('.all_next_page').show();
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
				$('#content').empty();
				currentTweetPage--;	
				$('.all_next_page').show();
				setPageContent(currentTweetIndex,end);	
				if (currentTweetPage == 1)
				{
					$('.all_prev_page').hide()
				}
				else
				{
					$('.all_prev_page').show();
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
				$('#replies_content').empty();
				currentRepliesPage++;	
				setPageContent(currentRepliesIndex,end);			
				$('.replies_prev_page').show();
				if (currentRepliesPage == repliesPages)
				{
					$('.replies_next_page').hide();
				}
				else
				{
					$('.replies_next_page').show();
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
				$('#replies_content').empty();
				currentRepliesPage--;	
				$('.replies_next_page').show();
				setPageContent(currentRepliesIndex,end);	
				if (currentRepliesPage == 1)
				{
					$('.replies_prev_page').hide()
				}
				else
				{
					$('.replies_prev_page').show();
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
				$('#dm_content').empty();
				currentDMPage++;	
				setPageContent(currentDMIndex,end);				
				$('.dm_prev_page').show();
				if (currentDMPage == dmPages)
				{
					$('.dm_next_page').hide();
				}
				else
				{
					$('.dm_next_page').show();
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
				$('#dm_content').empty();
				currentDMPage--;	
				$('.dm_next_page').show();
				setPageContent(currentDMIndex,end);	
				if (currentDMPage == 1)
				{
					$('.dm_prev_page').hide()
				}
				else
				{
					$('.dm_prev_page').show();
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
						{
							var html = rowTemplate(formatTweet(currentTweets[i]));						
							$('#content').append(html);
							var endNum = ((end+1)> currentTweets.length)?currentTweets.length:(end+1);
							$('.all_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentTweets.length);
							break;
						}
						case "REPLIES":
						{
							var html = rowTemplate(formatTweet(currentReplies[i]));						
							$('#replies_content').append(html);
							var endNum = ((end+1)> currentReplies.length)?currentReplies.length:(end+1);
							$('.replies_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentReplies.length);
							break;
						}

						case "DM":
						{
							var html = dmTemplate(formatTweet(currentDMs[i]));						
							$('#dm_content').append(html);
							var endNum = ((end+1)> currentDMs.length)?currentDMs.length:(end+1);
							$('.dm_paging_text').html('Showing ' + (start+1) + ' - ' + endNum + ' of  ' + currentDMs.length);
							break;
						}
					}
				}
				catch(E)
				{
					//
				}
			}
			// wire row entries
			wireEntries();			
		}

		//
		// Paging for "ALL" Tweets
		//
		$('.next_page').click(function()
		{
			switch(currentTab)
			{
				case 'ALL':
				{
					nextTweetPage();
					break;
				}
				case 'REPLIES':
				{
					nextRepliesPage();
					break;
				}
				case 'DM':
				{
					nextDMPage();
					break;
				}
			}
		})
		$('.prev_page').click(function()
		{
			switch(currentTab)
			{
				case 'ALL':
				{
					prevTweetPage();
					break;
				}
				case 'REPLIES':
				{
					prevRepliesPage();
					break;
				}
				case 'DM':
				{
					prevDMPage();
					break;
				}
			}
		})
		
		//
		// This function sets up the row listeners to show and 
		// handle entry-level actions (e.g., reply, DM, retweet and favorites)
		//
		function wireEntries()
		{
			// HANDLE DISPLAY/HIDING OF ACTION MENU
			$('.icon').mouseover(function()
			{
				var id = $(this).attr('row_id');
				$('.action_menu').hide();

				$('.action_menu_' + id).show();
			});
			$('.message').mouseover(function()
			{
				$('.action_menu').hide();
			});

			// SHOW HOVER EFFECT OVER ACTION ITEM
			$('.action').mouseover(function()
			{
				$('.action').removeClass('active_action');
				$(this).addClass('active_action');
			});

			// HANDLE ACTION CLICKS
			$('.action').click(function()
			{
				var textbox = $('#tweettext');

				// HANDLE REPLY
				if ($(this).hasClass('reply'))
				{
					textbox.val('@' + $(this).attr('name') + ' ');
					var val = textbox.val().length;
					textbox[0].setSelectionRange(val,val)
					displayLength();
					return;
				}

				// HANDLE DIRECT MESSAGE
				if ($(this).hasClass('dm'))
				{
					textbox.val('D '+$(this).attr('name') + ' ');
					var val = textbox.val().length;
					textbox[0].setSelectionRange(val,val)
					displayLength();
					$('#mode').val('DM')								
					$('#target_user').val($(this).attr('name'))	
					return;							
				}

				// HANDLE RETWEET
				if ($(this).hasClass('retweet'))
				{
					var message = $('.message_' + $(this).attr('row_id')).html();
					textbox.val('RT @'+$(this).attr('name')+': '+message+ ' ');
					var val = textbox.val().length;
					textbox[0].setSelectionRange(val,val)
					displayLength();	
					$('#mode').val('RT');							
					return;
				}

				// HANDLE FAVORITE
				if ($(this).hasClass('favorite'))
				{
					var tweetId = $(this).attr('tweet_id');
					$.ajax(
					{
						'username':username,
						'password':password,
						'type':'POST', 
						'url':'http://twitter.com/favorites/create/'+tweetId+'.json',
						'data':{'id':tweetId},
						success:function(resp,textStatus)
						{
							$('#tweettext').val('');
							displayLength();
							notification.setTitle('Favorite');
							notification.setMessage('Your favorite request was successful');
							notification.setIcon('app://images/notification.png');
							notification.show();
						},
						error:function(XMLHttpRequest, textStatus, errorThrown)
						{
							$('#tweettext').val('');
							displayLength();
							notification.setTitle('Favorite');
							notification.setMessage('Only one favorite per tweet!');
							notification.setIcon('app://images/notification.png');
							notification.show();
						}

					});
					return;
				}
			});			
			
		}
		// wire up refresh button
		$('#refresh').click(loadTweets).mouseover(function()
		{
			$(this).attr('src','images/main/refresh_hover.png');
		}).mouseout(function()
		{
			$(this).attr('src','images/main/refresh.png');
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
				timer = setTimeout(loadTweets,interval);
			}
		}
		
		var soundPlaying = false;
		var soundEnabled = true;
		
		function playSound(path)
		{
			if (!soundEnabled) return; // if turned off, don't use it!
			if (soundPlaying) return; // just prevent in case we get into situation where we're playing already
			try
			{
				soundPlaying = true;
				var sound = ti.Media.createSound(path);
				sound.onComplete(function()
				{
					soundPlaying = false;
				})
				sound.play();
			}
			catch(E)
			{
				ti.App.debug('sound exception for '+path+', exception = '+E);
			}
		}
		
		var notification = new ti.Notification;
		
		function onNewTweets(count)
		{
			if (count > 0)
			{
				playSound('app://audio/New.mp3');
				
				try
				{
					var ps = count > 1 ? 's':'';
					notification.setTitle('New Tweet'+ps+' received');
					notification.setMessage(count+' new tweet'+ps+' received');
					notification.setIcon('app://images/notification.png');
					notification.show();
				}
				catch(E)
				{
					alert(E);
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
			ti.App.debug('adjusting rate limit minutes remaining='+minutes_left+', interval='+interval+', remaining='+remaining_tweets);
			startTimer();
		}
		
		// determine the rate limit
		function checkRateLimit()
		{
			$.ajax(
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
					loadTweets();
				}
			});
		}
		
		// initially check the rate and set it
		checkRateLimit();

		// create our tray area icon
	    var menu = ti.Menu.createTrayMenu("app://images/tray_msg.png",null,function(sysmenu)
	    {
	       if (ti.Window.currentWindow.isVisible())
	       {
	          ti.Window.currentWindow.hide();
	       }
	       else
	       {
	          ti.Window.currentWindow.show();
	       }
	    });
	
		function displayLength(e)
		{
			var count = $("#tweettext").val().length;
			$('#tweetcount').html(140-count);
			if (count > 0)
			{
				$("#go").removeAttr('disabled');
			}
			else
			{
				$("#go").attr('disabled','true');
			}
		}

		function calcLength(e)
		{
			var count = $("#tweettext").val().length;
			var len = 140 - (count + 1); // we add once since the new key isn't yet counted
			if (len < 0 && e.keyCode!=8) // allow backspace!
			{
				e.preventDefault();
				ti.Media.beep();
				return false;
			}
		}

		$('#tweettext').keyup(displayLength);
		$('#tweettext').keydown(calcLength);

		displayLength();
		
		var height = ti.Window.currentWindow.getHeight();

		$('#shade').click(function()
		{
			if ($('#shade').hasClass('open'))
			{
				$('#shade').attr('class','')
				$('#top').css('display','');
				ti.Window.currentWindow.setHeight(height);
			}
			else
			{
				$('#shade').attr('class','open');
				$('#top').css('display','none');
				ti.Window.currentWindow.setHeight(height-145);
			}
		});
		
		$('#go').click(function()
		{
			var tweet = $.gsub($('#tweettext').val(),'\n','');
			var mode = $('#mode').val();
			if (mode == 'NORMAL')
			{
				$.ajax(
				{
					'username':username,
					'password':password,
					'type':'POST', 
					'url':'http://twitter.com/statuses/update.json',
					'data':{'status':tweet, 'source':'tweetanium'},
					success:function(resp,textStatus)
					{
						$('#tweettext').val('');
						displayLength();
						loadTweets();
					},
					error:function(XMLHttpRequest, textStatus, errorThrown)
					{
						notification.setTitle('Update');
						notification.setMessage('Sorry there was an error from Twitter!');
						notification.setIcon('app://images/notification.png');
						notification.show();
					}
				});
			}
			// DIRECT MESSAGE
			else if (mode == 'DM')
			{
				var user = $('#target_user').val();
				$.ajax(
				{
					'username':username,
					'password':password,
					'type':'POST', 
					'url':'http://twitter.com/direct_messages/new.json',
					'data':{'text':tweet, 'user':user},
					success:function(resp,textStatus)
					{
						$('#tweettext').val('');
						displayLength();
						notification.setTitle('Direct Message');
						notification.setMessage('Your message has been sent');
						notification.setIcon('app://images/notification.png');
						notification.show();
						
					},
					error:function(XMLHttpRequest, textStatus, errorThrown)
					{
						notification.setTitle('Direct Message');
						notification.setMessage('Sorry there was an error from Twitter!');
						notification.setIcon('app://images/notification.png');
						notification.show();
					}

				});
			}
			
			// RESET MODE
			$('#mode').val('NORMAL');
		});
		
		setTimeout(function(){
			$("#tweettext").focus();	
		},1000);
	});
})(jQuery);

