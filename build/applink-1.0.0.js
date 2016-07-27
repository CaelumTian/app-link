"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

;(function (win) {
    //基础参数
    var doc = win.document,
        ua = win.navigator.userAgent,
        isWin = /Windows\sPhone\s(?:OS\s)?[\d\.]+/i.test(ua) || /Windows\sNT\s[\d\.]+/i.test(ua),
        isIOS = /iPhone|iPad|iPod/i.test(ua),
        isAndroid = /Android/i.test(ua);

    //重要内容
    var uuid = 1,
        iframePool = [],
        iframeLimit = 4;

    //前缀命名常量
    var PROTOCOL_NAME = "applink",
        IFRAME_PRE = "iframe_",
        SUCCESS_PRE = "succ_",
        FAILURE_PRE = "fail_",
        DEFERRED_PRE = "defe_",
        GC_TIME = 60 * 1000 * 5;

    var Applink = {
        funcs: {},
        /**
         * web调用原生应用
         * @param {String} objName 调用原生的类名
         * @param method  调用原生类中的方法
         * @param {Object} params  传递的参数
         * @param {Function}success 成功回调函数
         * @param fail    失败回调函数
         * @param {Number} timeout 超时时间
         */
        invoke: function invoke(objName, method, params, success, fail, timeout) {
            var uuid;
            var deferred;
            var self = this;

            if (typeof arguments[arguments.length - 1] === "number") {
                timeout = arguments[arguments.length - 1];
            }
            if (typeof success !== 'function') {
                success = null;
            }
            if (typeof fail !== 'function') {
                fail = null;
            }
            if (Promise) {
                deferred = {};
                deferred.promise = new Promise(function (resolve, reject) {
                    deferred.resolve = resolve;
                    deferred.reject = reject;
                });
            }
            //超时设定
            if (timeout > 0) {
                uuid = setTimeout(function () {
                    self._onComplete(uuid, { res: "native响应超时" }, "fail");
                }, timeout);
            } else {
                uuid = this._getUuid();
            }
            this._registerCall(uuid, success, fail, deferred);
            this._registerGC(uuid, timeout);
            this._postMessage(objName, method, params, uuid);

            console.log(deferred);
            if (deferred) {
                return deferred.promise;
            }
        },

        //给客户端的成功与失败回掉
        onSuccess: function onSuccess(uuid, data) {
            this._onComplete(uuid, data, 'success');
        },
        onFail: function onFail(uuid, data) {
            this._onComplete(uuid, data, 'fail');
        },
        /**
         * native响应web回调
         * @param  uuid
         * @param {String|Object} data
         * @param type
         * @private
         */
        _onComplete: function _onComplete(uuid, data, type) {
            clearTimeout(uuid);
            //最后的数据
            var result;
            //call对象, 包含了需要的内容, 释放资源
            var call = this._cancelRegisterCall(uuid);

            var success = call.success,
                fail = call.fail,
                deferred = call.deferred;
            //对data解析成string
            if (data && typeof data === "string") {
                try {
                    result = JSON.parse(data);
                } catch (e) {
                    console.log("Native返回的JSON格式有问题");
                }
            } else {
                result = data || {};
            }

            if (type === "success") {
                success && success(result);
                deferred && deferred.resolve(result);
            } else if (type === 'failure') {
                fail && fail(result);
                deferred && deferred.reject(result);
            }
            //IOS下回收iframe
            if (isIOS) {
                this._recoverIframe(uuid);
            }
        },
        /**
         * 回收IOS使用的Iframe
         * @private
         */
        _recoverIframe: function _recoverIframe(uuid) {
            var iframeId = IFRAME_PRE + uuid;
            var iframe = doc.querySelector('#' + iframeId);
            if (iframePool.length >= iframeLimit) {
                doc.body.removeChild(iframe);
            } else {
                iframePool.push(iframe);
            }
        },
        _postMessage: function _postMessage(objName, method, params, uuid) {
            if (params && (typeof params === "undefined" ? "undefined" : _typeof(params)) === "object") {
                params = JSON.stringify(params);
            } else {
                params = "";
            }
            if (isWin) {
                this._onComplete(uuid, { res: "windows环境下,或者设备不支持" }, "fail");
            } else {
                //协议格式
                var uri = PROTOCOL_NAME + "://" + objName + ":" + uuid + "/" + method + "?" + params;
                if (isIOS) {
                    this._useIframe(uuid, uri);
                } else if (isAndroid) {
                    var value = PROTOCOL_NAME + ":";
                    win.prompt(uri, value);
                } else {
                    this._onComplete(uuid, { res: "jsbridge并不在支持的设备中" }, "fail");
                }
            }
        },
        /**
         * 利用iframe完成安卓上的js通信
         * @param uuid
         * @param url
         * @private
         */
        _useIframe: function _useIframe(uuid, url) {
            var iframeId = IFRAME_PRE + uuid;
            var iframe = iframePool.pop();
            if (!iframe) {
                iframe = doc.createElement("iframe");
                iframe.setAttribute('frameborder', '0');
                iframe.style.cssText = 'width:0;height:0;border:0;display:none;';
            }
            iframe.setAttribute("id", iframeId);
            iframe.setAttribute("src", url);
            if (!iframe.parentNode) {
                setTimeout(function () {
                    doc.body.appendChild(iframe);
                }, 10);
            }
        },
        _registerGC: function _registerGC(uuid, timeout) {
            var self = this;
            var gc_time = Math.max(timeout || 0, GC_TIME);

            setTimeout(function () {
                self._cancelRegisterCall(uuid);
            }, gc_time);
        },
        /**
         * 删除回调函数
         * @param uuid
         * @private
         */
        _cancelRegisterCall: function _cancelRegisterCall(uuid) {
            var sucId = SUCCESS_PRE + uuid,
                failId = FAILURE_PRE + uuid,
                defId = DEFERRED_PRE + uuid;
            var result = {};
            if (this.funcs[sucId]) {
                result.success = this.funcs[sucId];
                delete this.funcs[sucId];
            }
            if (this.funcs[failId]) {
                result.fail = this.funcs[failId];
                delete this.funcs[failId];
            }
            if (this.funcs[defId]) {
                result.deferred = this.funcs[defId];
                delete this.funcs[defId];
            }
            return result;
        },
        /**
         * 注册native 执行成功后的回调函数
         * @param uuid
         * @param success
         * @param fail
         * @param deferred
         * @private
         */
        _registerCall: function _registerCall(uuid, success, fail, deferred) {
            if (success) {
                this.funcs[SUCCESS_PRE + uuid] = success;
            }
            if (fail) {
                this.funcs[FAILURE_PRE + uuid] = fail;
            }
            if (deferred) {
                this.funcs[DEFERRED_PRE + uuid] = deferred;
            }
        },
        /**
         * 获取uuid
         * @returns {string}
         * @private
         */
        _getUuid: function _getUuid() {
            return Math.floor(Math.random() * (1 << 50)) + '' + uuid++;
        }
    };
    if (!window.Applink) {
        window.Applink = Applink;
    }
})(window);