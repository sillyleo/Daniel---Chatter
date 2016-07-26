window._ceWin = null;
window._ceWidthSize = 370;
window._ceEnableCollect = false;

window._ceCount = 0;
window._collectStamp = {};
window._ceRecordInterval = 100;
window._collectEvents = ['mousemove', 'scroll', 'click'];
window._windowEvents = ['focus','blur'];
window._ceCollectAction = function(eventArg){
    // Avoid bubble event triggers.

    if(window._ceWin && window._ceEnableCollect && eventArg._ceHasTriggered !== true){
        // to do send event name
        // console.log(eventArg);
        var stamps = window._collectStamp;
        var curTime = (new Date()).getTime();
        var isBubble = eventArg.bubbles;
        var storeTime = stamps[eventArg.type] || eventArg.target._lastScrollStamp || 0;
        if( curTime - storeTime >= window._ceRecordInterval){
            var target = eventArg.target;
            // var type = (_visibilityChange == eventArg.type)
            var actionObj = {
                target_id: target._ceSerial,
                event: eventArg.type,
                stamp: curTime,
                scrollTop: target.scrollTop,
                scrollLeft: target.scrollLeft,
                x: eventArg.x,
                y: eventArg.y
            };
            if(actionObj.event == _visibilityChange) actionObj.status = document[_visibilityState];
            var o = {
                event: 'update_user_action',
                actionInfo: JSON.stringify(actionObj)
            };
            window._ceWin.postMessage(JSON.stringify(o), "*");

            if(isBubble) stamps[eventArg.type] = curTime;
            else target._lastScrollStamp = curTime;
            console.log("event:[" + eventArg.type + "] Record!");
        }

        eventArg._ceHasTriggered = true;
    }
};

(function() {
    // events of window and document should doing something other.
    Element.prototype._addEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(name,eventFn,capture) {
        var combinedFn = eventFn;
        if(_collectEvents.indexOf(name) != -1){
            combinedFn = function(){
                eventFn.apply(this, arguments);
                var eventArg = null,
                    i = 0, len = arguments.length;
                for(; i < len; i++){
                    if(arguments[i].toString().substr(-6) == 'Event]'){
                        eventArg = arguments[i];
                        break;
                    }
                }
                if(eventArg) window._ceCollectAction.call(this, eventArg);
            };
        }
        this._addEventListener(name, combinedFn, capture);
    };

})();

function _changeIframeSize(w, h){
    _messageIframe.width = w;
    _messageIframe.height = h;
}

function _ceOnChatButtonClick(duration){
    duration = duration || 200;
    if(window._messageIframe){
        var width = window._ceWidthSize;
        var unitTime = 20;
        var stampWidth = width;
        var unitPixel = width / (duration / unitTime);
        var counts = Math.floor(duration / unitPixel);
        var int = setInterval(function(){
            stampWidth -= unitPixel;
            if(stampWidth < 0) stampWidth = 0;
            window._messageIframe.style['right'] = (-stampWidth) + 'px';
            if(stampWidth == 0){
                clearInterval(int);
            }
        }, unitTime);
    }
}

function _ceSlideOut(duration){
    duration = duration || 200;
    if(window._messageIframe){
        var width = window._ceWidthSize;
        var unitTime = 20;
        var stampWidth = 0;
        var unitPixel = width / (duration / unitTime);
        var counts = Math.floor(duration / unitPixel);
        var int = setInterval(function(){
            stampWidth += unitPixel;
            if(stampWidth > width) stampWidth = width;
            window._messageIframe.style['right'] = (-stampWidth) + 'px';
            if(stampWidth == width){
                clearInterval(int);
            }
        }, unitTime);
    }
}

function getCookie(name) {
  var value = "; " + document.cookie;
  var parts = value.split("; " + name + "=");
  if (parts.length == 2) return parts.pop().split(";").shift();
  return null;
}

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    }
    else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getValidJSON(str) {
    try {
        var o = JSON.parse(str);
        return o;
    } catch (e) {
        return null;
    }
}

function _getMaxZindex(dom){
    dom = dom || document.body;
    var maxZindex = -1;
    var items = dom.querySelectorAll('*');
    for(var i = 0, len = items.length; i< len; i++){
        var item = items[i];
        var styles = getComputedStyle(item);
        var zIndex = styles["zIndex"];
        var getIt = zIndex != 'auto';
        if(getIt){
            maxZindex = Math.max(parseInt(zIndex), maxZindex);
        }
    }
    return maxZindex;
}

function _hookWindowEvents(){
    window._windowEvents.forEach(function(name){
        window.addEventListener(name, _ceCollectAction);
    });
}

function _hookDocumentEvents(){
    // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
    // Set the name of the hidden property and the change event for visibility
    window._visibilityChange = "";
    window._visibilityState = "";
    if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
      _visibilityChange = "visibilitychange";
      _visibilityState = "visibilityState";
    } else if (typeof document.mozHidden !== "undefined") {
      _visibilityChange = "mozvisibilitychange";
      _visibilityState = "mozVisibilityState";
    } else if (typeof document.msHidden !== "undefined") {
      _visibilityChange = "msvisibilitychange";
      _visibilityState = "msVisibilityState";
    } else if (typeof document.webkitHidden !== "undefined") {
      _visibilityChange = "webkitvisibilitychange";
      _visibilityState = "webkitVisibilityState";
    }

    _collectEvents.concat([_visibilityChange]).forEach(function(name){
        document.addEventListener(name, _ceCollectAction);
    });
}

function _hookElementsEvent(elList){
    var i = 0, len = elList.length;
    for(; i < len; i++){
        var el = elList[i];
        el._ceSerial = ++_ceCount;
        // scroll
        if(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth){
            el.addEventListener('scroll', function(){});
        }

    }
}

window.addEventListener("load", function _onload(event){
    window.removeEventListener("load", _onload, false);
    window.addEventListener('message', function(e){
        var chatInfo;
        if(e.data == "onPanelHeaderClick"){
            _ceSlideOut();
        }else if(e.data == "onButtonClick"){
            _changeIframeSize(370, document.body.clientHeight);
        }else if(e.data == "debugTest"){
            alert("cross-domain test");
        }else if(chatInfo = getValidJSON(e.data)){
            var fn = chatInfo.fn;
            if(fn){
                eval("var _tmpFn = " + fn);
                _tmpFn.apply(chatInfo.scope || this, chatInfo.args || []);
                window._tmpFn = null;
            }
        }
    }, false);

    var dom = window._messageIframe =  document.createElement('iframe');
    var maxZindex = _getMaxZindex();
    dom.style.cssText = "position: fixed; right: -370px; bottom: 0px;margin: 0px;padding: 0px; border: 0px;background: transparent;";
    dom.style['zIndex'] = maxZindex + 2;
    dom.width = window._ceWidthSize;
    dom.height = document.body.clientHeight;
    dom.addEventListener('load', function(){
        window._ceWin = dom.contentWindow;
        var randomId = Math.random().toString(36).substring(7);
        var domNode = document.createElement('div');
        domNode.id = "ce-" + randomId +  "-wrap";
        domNode.style.cssText = "position:fixed;right:30px;bottom:30px;width:60px;height:60px;background:transparent;border-radius:20px;overflow:hidden;";
        domNode.style['zIndex'] = maxZindex + 1;
        domNode.innerHTML = '<button style="width:100%;height:100%;cursor:pointer;background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAACWCAYAAAA8AXHiAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NEZDNTJGRUYxOUE1MTFFNjlFMzdBMjcwMDNBQUVDNzgiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NEZDNTJGRjAxOUE1MTFFNjlFMzdBMjcwMDNBQUVDNzgiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDo0RkM1MkZFRDE5QTUxMUU2OUUzN0EyNzAwM0FBRUM3OCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDo0RkM1MkZFRTE5QTUxMUU2OUUzN0EyNzAwM0FBRUM3OCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgLDwiIAAAWqSURBVHja7N3tTxsFHMDx3/WuFFrkSTaIdIFMQBkmSga+0CzROTUumvjGiW800Rj1lduLvdRXvjAmPvwDvvCFJpolRmO2+LgXPsSABo3CAiJvlKiALTBg9IHW39GNgEBL4W69ct9P9kszRm179+3dtV7ByGazAjgtwCIAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYYGwQFgAYaH0LK/ckaXhw7V6cUanX6ddx9xnyzqm84XOa+HuiR/3e1iGF37liUbVpRcXdFp98GTO6JzVuN4gLPe3VD/7JKr1HtO4znGM5Z7TPozK9qY+qUzCck+/T49vozp3EZZ7Onz84qmLsNxj+jisMGEBhAXCAmEBhIWSsnzxKLOrfzzHMMQgrHJrKSOSulwp6SVLsiveXH+hhuVawiojmRVTlmcqJZtiT88xloMS/4aIirCctZKwJJM0WbPsCp0Pa/ujZckEq6N/VBw4kbQibSExSvvwrfqeU3rxqEP/uWWdUZ33dc6X/IWJB87HcvQOJOJhSS9u3mIFghXxut53DLPmSJ0PNhifSu6skVl2hU6+HPz/s8cKzDccuxD2SVS2B3U+LuUeyRdHuNWdZ+eMYGPIZ4c5x3SeJiy39vVmYKny0BOHfHoM/QxhufUAQ/Ux2b9vcBdyO2G59QCtcMrHr/pDhIX99YRmEYCwQFggLICwQFggLICwQFjwK4tFkN9KJiOxmRmxz1truLFRLGvnZ6deubIsc7OzUlkZkrr6+p3fqN5WLB6XZCK5ej37+oS1j8zPX5bBwUFJJBKrfw9alvT09EjjgcaC1x0f+03GxsfX/t7QUC99fX1imvnDTCaTMjAwsHrbNsMw5EjXrdLa1sausEh/eXXhDA0NrUVlS6XTMvTT0OpWLJ94LLYhKlssFpfR0dGCtzkyPLIWVW7jlZXhkUuysLBAWEU678UFY+/GFhcXN309lUrLrO6m8pmamtry6zPT0wVvd3qb75newXUJa6NXJfdBAG8dI+Q5lrKs/EcQ5jb/HjALH59td13LNAmrGOHuCXuf8ZS9MfDSggkGg3Jwi2OpG6qrpbamJu91W1paJBDYvGij0WjB24223LT5vmhsTc3NhLWLuD6Q3Dna33pp4dyhB+pNTQc3HID36gG4/UMX8qmqqpLeo0clrJfXtn4d7e3StoMD8I7OTv2+Vg0zdxuRSEQP+nuloqKirMLyxM95X29p+HCLXtyis9Vm4REp8AGB1GLww0zK/HIt2raXbwu19D+/17cc7LcAzF3sjlKp1Oqu0zCKOz3aXi9pfbFgbzn3uo55uyG39ZrUi8ltoiv0lH87GEk9G+4eXf9sOb3X+2QGdr9h320YdogOROXvXaFD3tN5TsPMCgjLIR/pPKlRrbBKCcspn+icIirCctJFncc1qiSrkrCc8p3OwxrVEquRsJwyoHOSqAjLSb/qPKRRzbH6CMspIzrHNaoYq87byup8LA3qM1YZWyyvyLCaCcsNf/t4/c4Rlnu+Fm/+Yorr4SJhucc+9fldn4b1OmG560WdMZ9F9YrON4TlLvvtCfsXe5/zwWO1fwT3CzovlfJOeO5Ev+vgZp37dJo9+MQ6oXN3ge+xf4b791t8/dovEPhcp+Qf6fFjWF4W0flK584833NG5y3ebkAx7M+bPaDzQ7k/EMLyHvu9p5OS+3+ihAVH2Z9OPa4zTlhwI657dX4nLDjtz6vHXJOEBadN6Nyj8w9hwWn2sdb9OjOEBaf9cnW3WBZnzvIGKdhigbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWABhgbBAWEBx/hNgALEYRvU05ASFAAAAAElFTkSuQmCC) no-repeat;background-position:center;background-size:160%;border:0px;border-radius:20px;" onclick="_ceOnChatButtonClick();"></button>';
        document.body.appendChild(domNode);
    });
    dom.src = window._debugUrl || "http://www.makemap.org/client/index.html";
    document.body.appendChild(dom);

    _hookWindowEvents();
    _hookDocumentEvents();
    _hookElementsEvent(document.querySelectorAll('*'));

},false);

