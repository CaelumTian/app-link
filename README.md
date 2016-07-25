Applink    
===    
提供H5页面和客户端通讯的机制。提供webview中js调用IOS，Andriod内部方法的机制。提供事件机制，方便Native对js的调用。 
### 如何使用  
```javascript  
window.applink.invoke("class", "function", params, success, fail, timeout);
```  

### 支持Promise    
在不支持Promise的时候，返回值为空
```javascript  
let promise = window.applink.invoke("class", "function", params);
promise.then(function(res) {
    //...
}).catch(function(res) {
    //...
})

### 版本1.0.0  
1. 完成js对ios和native的调用  
2. 完成Promise  

### 待更新问题  
1. 文档补充完整  
2. 重构代码结构  
3. 添加对UA的更多侦测，假如指定的UA
4. 添加单测内容  
5. 添加hybird.js的封装



