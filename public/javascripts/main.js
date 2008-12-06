(function($)
{
	ti.ready(function()
	{
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
				return '<a target="_new" href="' + m[0] + '">' + m[0] + '</a>';
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
			obj.created_at = formatTime(d.getHours(),d.getMinutes());
			if (!today(d))
			{
				obj.created_at = days[d.getDay()] + obj.created_at;
			}
			obj.text = linkReplies(linkURIs(obj.text));
			return obj;
		}
		
		var rowTemplate = AppC.compileTemplate(''+
		'<div class="entry">'+
		'	<div class="top">'+
		'		<a target="ti:systembrowser" href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}">#{user.name}</a> <span>#{created_at} via #{source}</span>'+
		'	</div>'+
		'	<div class="icon">'+
		'		<a target="ti:systembrowser" href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}"><img src="#{user.profile_image_url}"/></a>'+
		'	</div>'+
		'	<div class="message">#{text}</div>'+
		'</div>');
		
		var content = $('#content');
		
		function loadTweets()
		{
			if (remaining_tweets < 0)
			{
				$('#status_msg').html('Rate limit exceeded');
				checkRateLimit(); // go check again
				return;
			}
			$('#refresh').attr('src','images/main/refresh_bolt.png');
			$.ajax(
			{
				'username':username,
				'password':password,
				'url':'http://twitter.com/statuses/friends_timeline.json?count=4',
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
					
					for (var c=0;c<tweets.length;c++)
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
					
					remaining_tweets--;
					resetInterval();
					onNewTweets(tweets.length);
					$('#refresh').attr('src','images/main/refresh.png');
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					//TODO
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
					loadTweets();
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					//FIXME
					alert('error:'+textStatus+',error:'+errorThrown);
				}
			});
		});
		
		setTimeout(function(){
			$("#tweettext").focus();	
		},1000);
	});
})(jQuery);

