Applink    
===    
![](https://travis-ci.org/T-phantom/app-link.svg?branch=master) ![](https://img.shields.io/badge/npm-v1.1.0-blue.svg)  
提供H5页面和客户端通讯的机制。提供webview中js调用IOS，Andriod内部方法的机制。提供事件机制，方便Native对js的调用。 
## 如何使用    
### 1.0.0
```javascript  
window.applink.invoke("class", "function", params, success, fail, timeout);
```    
### 1.1.0    
`Applink` 类为单例模式  
初始化对象，调用native
```javascript  
//初始化参数 协议头部 超时时间 
let applink = new Applink("aplink", 60 * 1000 * 10);  
applink.invoke("class", "function", params, success, fail, timeout);
```  
利用事件native调用H5   
H5注册事件， 客户端只需要调用`applink.fireEvent`方法，来触发H5的JS
```javascript  
document.addEventListener('eventName', function(data) {
	// 这里要注意，Native 传递过来的事件参数是在 data 的 param 属性中。
	alert(data.param);
}, false);
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
```  

## changelog   
### 1.0.0  
1. 完成js对ios和native的调用  
2. 完成Promise   

### 1.1.0  
1. ES6重构代码，改变代码结构
2. 加入事件监听，方便native调用H5
3. 可配置协议头信息，超时信息  
4. 优化显示内容  

### 1.1.1  
1. 添加单元测试

### 待更新问题  
1. 添加对UA的更多侦测，假如指定的UA
2. 添加单测内容  
3. 添加hybird.js的封装
