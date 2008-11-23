(function($)
{
//	ti.App.setSize(350,730,false);
	
	$(function()
	{
		//TODO: since, paging
		var username = AppC.params.u;
		var password = AppC.params.p;
		var remember = AppC.params.r;
		
		var months = {'Jan':0,'Feb':1,'Mar':2,'Apr':3,'May':4,'Jun':5,'Jul':6,'Aug':7,'Sep':8,'Oct':9,'Nov':10,'Dec':11};
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
				h = 24 - h;
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
				return '<a target="_new" href="http://twitter.com/' + m[0].substring(1) + '">' + m[0] + '</a>';
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
		'		<a href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}">#{user.name}</a> <span>#{created_at} via #{source}</span>'+
		'	</div>'+
		'	<div class="icon">'+
		'		<a href="http://twitter.com/#{user.screen_name}" alt="Go to profile for #{user.name}"><img src="#{user.profile_image_url}"/></a>'+
		'	</div>'+
		'	<div class="message">#{text}</div>'+
		'</div>');
		
		var content = $('#content');
		
		function loadTweets()
		{
			$.ajax(
			{
				'username':username,
				'password':password,
				'url':'http://twitter.com/statuses/friends_timeline.json?count=4',
				'dataType':'json',
				success:function(tweets,textStatus)
				{
					content.empty();
					for (var c=0;c<tweets.length;c++)
					{
						try
						{
							var html = rowTemplate(formatTweet(tweets[c]));
							content.append(html);
						}
						catch(E)
						{
							alert(E);
						}
					}
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					//TODO
				}
			});
		}
		
		loadTweets();

	    var visible = true;

/*
	    var menu = ti.Menu.createSystemMenu("ti://public/images/tray_msg.png",function(sysmenu)
	    {
	       if (visible)
	       {
	          ti.App.hide();
	       }
	       else
	       {
	          ti.App.show();
	       }
	       visible = !visible;
	    });
*/
		function calcLength()
		{
			var len = 140 - $('#tweettext').val().length;
			$('#tweetcount').html(len);
		}

		$('#tweettext').get(0).onkeyup = calcLength;

		calcLength();

		$('#shade').click(function()
		{
			if ($('#shade').hasClass('open'))
			{
				$('#shade').attr('class','')
				$('#top').css('display','');
			}
			else
			{
				$('#shade').attr('class','open');
				$('#top').css('display','none');
			}
		});
		
		$('#go').click(function()
		{
			var tweet = $.gsub($('#tweettext').val(),'\n','');
			//TODO: source
			$.ajax(
			{
				'username':username,
				'password':password,
				'type':'POST',
				'url':'http://twitter.com/statuses/update.json',
				'data':{'status':tweet},
				success:function(resp,textStatus)
				{
					loadTweets();
				},
				error:function(XMLHttpRequest, textStatus, errorThrown)
				{
					alert('error:'+textStatus+',error:'+errorThrown);
				}
			});
		});
	})
	
})(jQuery);

