;(function(){
	

    var isInit = false,
        displayLoading = false,
        isNeedLoading = false,
        loading = null,
        $document = $(document);

    var listens = [];//laoded注册事件

    var touchSettings = {
        supressionThreshold: 10,//触发touchmove的敏感度
        horizontalThreshold: 10,//swipe的触发水平方向move必须小于这个距离
        verticalThreshold: 30//swipe的触发垂直方向move必须大于这个距离
    };


    var pageX = 0, pageY = 0, scrollTop = 0;//坐标
    var _data;

    // 检测滚动的默认DOM节点为body, 由于有些页面将列表容器设置为absolute定位, 因此提供changScrollDom来改变滚动检测的DOM
    var scrollDom = document.body;


    /**************  touch event  **************/

    function getDuration(x, y) {
        x = x || pageX;
        y = y || pageY;
        var horizontalAbs = Math.abs(x - pageX);
        var verticalAbs = Math.abs(y - pageY);
        return {
            horizontal: horizontalAbs > 0 ? (x - pageX) / horizontalAbs : 0,
            vertical: verticalAbs > 0 ? (y - pageY) / verticalAbs : 0
        };
    }

    //即使android下scrollDom为document也不能获取到scrollTop
    function getScrollTop(){
        if($.os.ios){
            return scrollDom.scrollTop;
        }else{
            return window.scrollY;
        }
    }

    function touchStart(event) {
        //Utils.traceLogAdd('touchstart');

        scrollTop = getScrollTop();//初始scrollTo

        if (!displayLoading) {
            _data = +new Date();
            //console.log('touchStart:', 0);
            var _touch = event.touches[0];
            if (_touch) {
                pageX = _touch.pageX;
                pageY = _touch.pageY;
            }
        }
    }

    function touchMove(event) {
        //Utils.traceLogAdd('touchmove');
        if (!displayLoading && !scrollTop && getScrollTop() <= 0) {
            isNeedLoading = false;
            var _length = event.touches.length;
            if (_length === 1) {//一个手指
                var _touch = event.touches[0];
                if (Math.abs(_touch.pageY - _touch.pageY) > touchSettings.supressionThreshold) {
                    e.preventDefault();
                } else if (_touch.pageY > pageY + touchSettings.verticalThreshold - 5) {//垂直距离
                    // 为了流畅的体验, 已经Android下很难触发下拉刷新, 这里减去10像素的高度, 后续可以通过优化调整 by johnnyguo
                    var _duration = getDuration(_touch.pageX, _touch.pageY);
                    if (_duration.vertical > 0) {
                        //console.log(_duration.vertical + ',touchMove:', new Date() - _data);
                        //向下滑动
                        isNeedLoading = true;
                        showLoading();
                       
                        //android 4.4（4.0）的bug，只触发touchmove一次，并且不触发touchend
                        if($.os.android == 4.4){ // change by bizai 
                            touchEnd();
                        }
                    }
                }
            }
        }
        //event.preventDefault();

    }

    function touchEnd(event) {
        if (displayLoading && !scrollTop) {
            var _this = this;
            if (isNeedLoading) {
                var returns = false;
                listens.forEach(function (fun) {
                    if (fun.call(_this, event)) {
                        returns = true;
                    }
                    //监听回调事件,如果有一个函数返回true，则表示需要手动触发loading消失
                });
                if (!returns) {
                    hideLoading();
                }
                isNeedLoading = false;
            }
        }
    }


    /**************  event manage  **************/

    function addEvent() {
        var dom = $.os.ios ? $(scrollDom) : $document;
        dom.on('touchstart', touchStart);
        dom.on('touchmove', touchMove);
        dom.on('touchend', touchEnd);
    }

    function deleteEvent() {
        var dom = $.os.ios ? $(scrollDom) : $document;
        dom.off('touchstart', touchStart);
        dom.off('touchmove', touchMove);
        dom.off('touchend', touchEnd);
    }


    /**************  about loading ****************/
    function initHtml() {
        loading = $('<div class="refresh_loading"></div>');
        $(document.body).append(loading);
    }

    function showLoading() {
        if (displayLoading) {
            return;
        }
        displayLoading = true;
        loading && (loading.show());
    }

    function hideLoading() {
        //if(!display) return;
        displayLoading = false;
        loading && (loading.hide());
    }


    /**************  start and desroy  ****************/
    function init(opt) {
        opt = opt || {};
        if (!isInit) {
            isInit = true;
            if (opt.dom) {
                scrollDom = $.os.ios ? opt.dom : document;
            }
            addEvent();
        }
        if (opt.reload) {
            listens.push(opt.reload);//添加注册事件
        }
    }

    function destroy() {
        deleteEvent();
        if (loading) {
            loading.remove();
            loading = null;
        }
        scrollTop = pageX = pageY = 0;//坐标
        isNeedLoading = displayLoading = isInit = false;
    }

    return {
        init: init,
        destroy: destroy,
        show: showLoading,
        hide: hideLoading,
        listen: function (opt) {
            if (opt.del) {
                //删除事件
                return listens.splice(indexOf(opt.reload));//移除注册事件
            } else {
                return opt.reload && listens.push(opt.reload);//添加注册事件
            }
        },
        pauseTouchMove: function() {
            deleteEvent();
        },
        restoreTouchMove: function() {
            deleteEvent();
            addEvent();
        }
    };

})();
