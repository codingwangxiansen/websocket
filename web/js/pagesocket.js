/**
 * Created by 123 on 2018/6/8.
 * webSocket封装
 * @params
 * userInfo -- 用户的信息
 * 定义自定义回调事件需要在初始化前定义
 */
function PageSocket(userInfo) {
  var that = this
  var ws;//websocket实例
  var lockReconnect = false;//避免重复连接
  var wsUrl = 'wss://whyj.gsafetyweixinsupport.cn/wuhan-site/websocket/text/' + userInfo.id;

  this.createWebSocket = function() {
    try {
      ws = new WebSocket(wsUrl);
      initEventHandle();
    } catch (e) {
      reconnect(wsUrl);
    }
  }

  function initEventHandle() {
    ws.onclose = function () {
      console.log('close')
      reconnect(wsUrl);
      if(typeof that.onclose === 'function'){
        that.onclose()
      }
    };
    ws.onerror = function () {
      reconnect(wsUrl);
      if(typeof that.onerror === 'function'){
        that.onerror()
      }
    };
    ws.onopen = function () {
      console.log('open')
      //心跳检测重置
      heartCheck.reset().start();
      if(typeof that.onopen === 'function'){
        that.onopen()
      }
    };
    ws.onmessage = function (event) {
      console.log('message')
      //如果获取到消息，心跳检测重置
      //拿到任何消息都说明当前连接是正常的
      heartCheck.reset().start();
      if(typeof that.onmessage === 'function'){
        that.onmessage(event.data)
      }
    }
  }

  function reconnect(url) {
    if(lockReconnect) return;
    lockReconnect = true;
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(function () {
      that.createWebSocket(url);
      lockReconnect = false;
    }, 2000);
  }


  //心跳检测
  var heartCheck = {
    timeout: 45000,//45秒
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function(){
      clearTimeout(this.timeoutObj);
      clearTimeout(this.serverTimeoutObj);
      return this;
    },
    start: function(){
      var self = this;
      this.timeoutObj = setTimeout(function(){
        //这里发送一个心跳，后端收到后，返回一个心跳消息，
        //onmessage拿到返回的心跳就说明连接正常
        console.log("HeartBeat")
        ws.send("HeartBeat");
        self.serverTimeoutObj = setTimeout(function(){//如果超过一定时间还没重置，说明后端主动断开了
          ws.close();//如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
        }, self.timeout)
      }, this.timeout)
    }
  }

  //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
  window.onbeforeunload = function () {
    closeWebSocket();
  }

  //关闭WebSocket连接
  function closeWebSocket() {
    ws.close();
  }


  //发送消息
  this.send = function(message) {
    ws.send(message);
  }

  //关闭连接
  this.close = function() {
    ws.close();
  }
}