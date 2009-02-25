var T ={};
T.getMembers = function(obj) 
{ 
	var s=[];

	for (i in obj) 
	{
		s.push(i+" (" + typeof obj[i] + ")\r\n"); 
	} 
	s.sort();
	return s.join(" "); 
}

T.dragApp = function() {

	var offsetx, offsety, handler;

	var defaultHandler = function(target,x,y)
	{
		if (y > 30) return false;
		if (jQuery(target).is(':input,img')) return false;
		return true;
	};

	function mover(e)
	{
		window.moveBy(e.clientX-offsetx,e.clientY-offsety);
		return false;
	}

	function cancel()
	{
		jQuery(document).unbind('mousemove',mover);
	}

	jQuery(document).bind('mousedown',function(e)
	{
		if (!handler) return; // allow this to be turned off by setting null
		var moveable = handler(e.target,e.clientX,e.clientY);
		if (moveable)
		{
			offsetx = e.clientX;
			offsety = e.clientY;
			jQuery(document).bind('mousemove',mover);
			jQuery(document).bind('mouseup',cancel);
		}
	});

	handler = defaultHandler;
}

document.onselectstart = function() { return false; };