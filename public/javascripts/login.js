/**
 * Tweetanium is released under the terms of the 
 * Apache Public License Version 2. 
 * Copyright (c) 2008 by Appcelerator, Inc.
 * http://tweetanium.com
 */

var db = null;
var notification = null;

function login()
{
	$("#login").hide();
	$("#indicator").show();
	
	var username = $('#username').val();
	var password = $('#password').val();
	var remember = ($('#remember').hasClass('unchecked'))?0:1;
	
	// get user if exsts
	var rs = db.execute('select username from User where username = ?',[username]);
	var userExists = false;
  	while (rs.isValidRow())
    {
		userExists = true;
		break;
	}
	rs.close();
	
	if (userExists == true)
	{
		db.execute("update User set last_login = 0");
		db.execute("update User set remember = ?, last_login = 1 where username = ?",[remember,username])
	}
	else
	{
		db.execute("update User set last_login = 0");
		db.execute('insert into User values(?,?,?,?,?)', [$('#username').val(), $('#password').val(), remember,1,1]);
	}
	db.close();

	$.ajax(
	{
		'username':username,
		'password':password,
		'url':'https://twitter.com/account/verify_credentials.json',
		'dataType':'json',
		success:function(data,textStatus)
		{
			if (textStatus == 'success')
			{
				window.document.location.href = 'main.html?u='+encodeURIComponent(username)+'&p='+encodeURIComponent(password)+'&r='+remember;
			}
			else
			{
				notification.setTitle('Login Failed');
				notification.setMessage("Twitter don't know you. Try again");
				notification.setIcon('app://images/notification.png');
				notification.show();
			}
		},
		error:function(XMLHttpRequest, textStatus, errorThrown)
		{
			notification.setTitle('Login Failed');
			notification.setMessage("Twitter don't know you. Try again");
			notification.setIcon('app://images/notification.png');
			notification.show();
		}
	});

	return false;
}
ti.ready(function($)
{
	// initialize credentials
	$('#username').val('');
	$('#password').val('');
	
	// create user table if not exists
 	db =  new ti.Database;
	db.open("tweetanium");	
	db.execute("create table if not exists User (username text,password text, remember int, sound_on int, last_login int)");

	// get user credentials if remember me is set and user has logged in before	
	var rs = db.execute("select username,password,remember from User where last_login = 1");
    while (rs.isValidRow())
    {
		// set credentials values if remember is set to true
		if (rs.field(2) == 1)
		{
			$('#username').val(rs.field(0));
			$('#password').val(rs.field(1));
			break;	
		}
		else
		{
			break;
		}
    }
    rs.close();

	// create global notificaiton object
	notification = new ti.Notification;
	
	$('#remember').click(function()
	{
		if ($('#remember').hasClass('unchecked'))
		{
			$('#remember').attr('class','');
		}
		else
		{
			$('#remember').attr('class','unchecked');
		}
		return false;
	})
	
	$('#login').click(login);
	
	// make the username become active
	setTimeout(function()
	{
		$('#username').focus();
	},1000);
});

