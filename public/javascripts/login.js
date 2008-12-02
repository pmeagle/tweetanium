ti.ready(function($)
{
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
	
	$('#login').click(function()
	{
		var username = $('#username').val();
		var password = $('#password').val();
		var remember = $('#remember').val();
		$.ajax(
		{
			'username':username,
			'password':password,
			'url':'https://twitter.com/account/verify_credentials.json',
			'dataType':'json',
			success:function(data,textStatus)
			{
				if (textStatus == 'success' && data.authorized)
				{
					window.document.location.href = 'main.html?u='+encodeURIComponent(username)+'&p='+encodeURIComponent(password)+'&r='+remember;
				}
				else
				{
					alert('login error = '+textStatus);
				}
			},
			error:function(XMLHttpRequest, textStatus, errorThrown)
			{
				alert('error='+textStatus+',error='+errorThrown);
			}
		});

		return false;
	});
	
	// make the username become active
	setTimeout(function()
	{
		$('#username').focus();
	},1000);
	
});

