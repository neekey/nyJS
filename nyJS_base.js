 //===========================================
 // 继承的实现
 //===========================================
(function(window, undefined){

 // 为所有的函数对象添加一个基类方法，这个方法的作用是向函数的原型中添加一个函数
 Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
 };
 // 添加 add_proto 方法
 // 为函数的原型添加内容（proto_obj),并通过if_overlap来控制是否覆盖已有属性
 Function.method("add_proto", function(proto_obj, if_overlap){
   for(var name in proto_obj){
     if(if_overlap){
       this.prototype[name] = proto_obj[name];
     }
     else{
       if(this.prototype[name] === undefined){
         this.prototype[name] = proto_obj[name];
       }
     }
   }
 });
 // 添加 set_cons 方法
 // 设置函数原型的构造函数（prototype.constructor)
 Function.method("set_cons", function(cons){
   this.prototype.constructor = cons;
 });
 
 // 添加 set_super 方法
 // 将父类的构造函数添加到当前函数中
 // 在子函数的构造函数中可以通过：arguments.callee.super.call(this, 参数...)来调用父函数的构造函数
 Function.method("set_super", function(parent_cons){
   this.super = parent_cons;
 });
 // 添加 inherit 方法
 // 构造一个以当前函数为父类的子函数
 // 参数child_obj 包括：constructor构造函数以及prototype函数原型
 // 参数可为空
 Function.method("inherit", function(child_obj){
   // 父函数的构造函数，作为闭包引用
   var parent_cons = this.prototype.constructor;
   // 父函数的原型，作为闭包引用
   var parent_prot = this.prototype;
   
   // 子函数的构造函数
   // 若参数中未给定构造函数，则默认构造函数为object
   var child_fn = (child_obj.constructor === Object) ? function(){} : child_obj.constructor;
   
   // 若 prototype属性不存在，则直为空对象
   child_obj.prototype = child_obj.prototype || {};
   
   // 将父函数的原型添加到子函数中
   child_fn.add_proto(parent_prot, true);
   
   // 为子函数添加自己的原型
   child_fn.add_proto(child_obj.prototype, true);
   
   // 重设子函数的原型构造函数
   child_fn.set_cons(child_fn);
   
   // 为子函数添加super 指向父函数的构造函数
   // 在子函数的构造函数中可以通过：arguments.callee.super.call(this, 参数...)来调用父函数的构造函数
   child_fn.set_super(parent_cons);
   
   // 返回子函数
   return child_fn;
 });
 //===========================================
 // 继承的实现 --- end
 //===========================================
 

 
 //===========================================
 // 基类 base
 //===========================================
 function base(){};
 base.add_proto({
   /**
    * 创建自身子类实例
    * @param child_obj <object> 
    * @return <object>
    * 
    * 若不给定参数，则直接返回构造函数为空的继承自父类的实例对象
    * 注意： 该方法并不会调用父类的构造方法，若需要，请覆盖该方法
    */
   create: function(child_obj){
     // 若child_obj 则置为空对象
     child_obj = child_obj || {};
     
     // 若写为： return new this.constructor.inherit(child_obj);
     // 将导致 inherit 内部this指向出错，原因未知...
     var child_fn = this.constructor.inherit(child_obj);
     return new child_fn();
   },
   /**
    * 向实例对象添加方法
    * @param fn_obj <object>
    */ 
   add_method: function(fn_obj){
     for(var name in fn_obj){
       this[name] = fn_obj[name];
     }
   }
 });
 
 //===========================================
 // 控制器 controller
 //===========================================
 var controller = base.inherit({
   constructor: function(event_list){
     // ====以下为非函数成员变量====
     /**
      * 用于存储当前控制响应的函数列表
      * 以事件名为索引, 每一项包括函数名与函数{
      *   fn_name: 函数名,
      *   fn： 函数
      * }
      * 默认为空
      * 每个事件只能对应一个函数， 
      * 为函数命名是为了方便标示，用于在事件列表中删除绑定的函数
      */
     this.response_list = {};
     
     // ====以下为构造函数内容====
     
     // this._event 为controller默认向其响应的事件列表
     // 若参数不给出，则默认为全局变量nyJS._event
     if(event_list === undefined){
       this._event = nyJS._event;
     }
     else{
       this._event = event_list;
     }
     
     
   },
   prototype: {
     /**
      * 重写父类的 create方法： 因为controller具有构造函数
      * 重写后，子类实例的构造过程中将先调用父类构造方法
      */
     create: function(child_obj){
       // 若child_obj 则置为空对象
       child_obj = child_obj || {};
       
       var child_cons = child_obj.constructor;
       child_obj.constructor = function(){
         controller.prototype.constructor.call(this);
         if(child_cons !== undefined ){
           child_cons.call(this);
         }
       }
       // 若写为： return new this.constructor.inherit(child_obj);
       // 将导致 inherit 内部this指向出错，原因未知...
       var child_fn = this.constructor.inherit(child_obj);
       return new child_fn();
     },
     
     /**
      * 向列表中添加函数
      * @param <object> fn_obj{
      *   event_name: 事件名称, 
      *   fn： 函数
      * }
      * 一次只添加一个事件函数
      * 若已经存在，将覆盖
      */
     response_add: function(fn_obj){
       this.response_list[fn_obj.event_name] = {
         fn_name: fn_obj.name,
         fn: fn_obj.fn
       };
     },
     /**
      * 删除事件响应列表中指定事件名称的项目
      * @param <string> event_name
      * 一次删除一个项目，自动检查是否存在该项目
      */
     response_delete: function(event_name){
       if(this.response_list[event_name] !== undefined){
         delete this.response_list[event_name];
       }
     },
     /**
      * 响应事件池中的函数
      * @param <object> res_list{
      *   event_name: {
      *     fn_name: 函数名称，作为标示,
      *     fn: 函数
      *   }
      * }
      */
     response: function(res_list){
       var res_obj;
       for(var res_name in res_list){
         // 向事件列表nyJS._event.list中添加函数
         res_obj = {
           fn_name: res_list[res_name].fn_name,
           fn: res_list[res_name].fn
         }
         this._event.list[res_name].bind(res_obj)
         // 想该控制器的函数列表中添加函数
         this.response_list[res_name] = res_obj;
       }
     },
     /**
      * 取消对某个事件的响应
      */
     unresponse: function(event_name){
       // 先从该控制器的函数列表中获得函数名，并将该项删除
       var fn_name = this.response_list[event_name].fn_name;
       this.response_delete(event_name);
       // 取消事件列表中该函数的绑定
       this._event.list[event_name].unbind(fn_name);
     }
   }
 });


 //===========================================
 // 事件模型 ny_event
 //=========================================== 
 var ny_event = base.inherit({
   // 构造函数
   constructor: function(event_obj){
     // ====以下为非函数成员变量====
     /**
      * 绑定在该事件上的函数列表
      * 以函数名称作为索引
      * fn_list[fn_name] = fn
      */
     this.fn_list = {};
     
     // ====以下为构造函数内容====
     this.event_type = event_obj.event_type;
     this.jq = event_obj.jq;
     this.event_name = event_obj.event_name;
     
     // 用于传递给函数的参数
     this.arguments = {
       jq: this.jq,
       event_type: this.event_type,
       event_name: this.event_name
     }
     
     /**
      * 运行所有绑定在该事件上的函数
      * @param <object> args: this.arguments
      */
     var this_closure = this;
     this.run_fns = function(){
       // 用于传递给函数列表中函数的参数
       args = this_closure.arguments;
       
       var test = {};
       // 用于有些事件响应函数通过返回 false来阻止服务器默认行为
       var fn_return = true;
       for(var fn_name in this_closure.fn_list){
         // 若函数返回值为false 则 阻止服务器行为
          if(this_closure.fn_list[fn_name](args) === false){
            fn_return = false;
          }
       }
       return fn_return;
     };
     
     // 为jq绑定事件
     this.jq.bind(this.event_type, this.run_fns);
   },
   // 原型
   prototype: {
     /**
      * 添加事件到事件列表
      * @param <object> fn_obj{
      *   fn_name: 函数名称
      *   fn: 函数
      * }
      */
     bind: function(fn_obj){
         this.fn_list[fn_obj.fn_name] = fn_obj.fn;
     },
     /**
      * 根据给定的函数名取消事件绑定
      * @param <string> fn_name
      */ 
     unbind: function(fn_name){
       if(this.fn_list[fn_name] !== undefined){
         delete this.fn_list[fn_name];
       }
     }
   }
 })
 
 //===========================================
 // 事件列表 _event
 //=========================================== 
 var _event = base.inherit({
   constructor: function(_event_name){
     this.name = this.name || _event_name;
     /**
      * 存储事件的事件列表
      * list[event_name] = event
      */
     this.list = {};
   },
   prototype: {
     
     /**
      * 为一个jquery在事件列表中注册
      * @param <object> event_info{
      *   type: 事件类型，该参数的取值与jquery的bind函数需要参数一致
      *   name: 事件名称,
      *   jq: jquery对象
      * }
      */
     reg: function(event_info){
       var event_obj = {
         event_type: event_info.type,
         event_name: event_info.name,
         jq: event_info.jq
       };
       var new_event = new ny_event(event_obj);
       this.add(new_event);
     },
     /**
      * 向事件列表中添加事件
      * @param <ny_event>
      */
     add: function(event_obj){
       this.list[event_obj.event_name] = event_obj;
     },
     /**
      * 向事件列表中删除指定名称的事件
      * @param <string> event_name
      */
     remove: function(event_name){
       if(this.list[event_name] !== undefined){
         delete this.list[event_name];
       }
     }
   }
 })
 
 //===========================================
 // 模型 model
 //=========================================== 
 var model = base.inherit({
   constructor: function(){
     // ====以下为非函数成员变量====
     this.data_model = {};
   },
   prototype: {
     
   }
 });
 
 //===========================================
 // 视图 view
 //=========================================== 
 var view = base.inherit({
   constructor: function(){
   },
   prototype: {
   }
 })
 
 //===========================================
 // 组件基类 component_base
 //=========================================== 
 var component_base = base.inherit({
   constructor: function(){
     // ====以下为非函数成员变量====
     
     // 视图
     this.view = new view();
     // 模型
     this.model = new model();
     // 事件列表
     this._event = new _event("component2");
     // 核心的js对象
     this.base_jq = {};
     // 辅助对象
     this.other_jq = {};
     
     // ====以下为非函数成员变量====
     
     // 构造指向 组件本身事件列表的控制器
     // 若使用 this.controller = new controller(this._event) 的写法会出错，原因不明...
     var new_contr = new controller(this._event);
     this.controller = new_contr;
   },
   prototype: {
     // 实现组建提供的外部接口事件
     bind: function(event_obj){
       this.controller.response(event_obj);
     }
   }
 })
 
 //===========================================
 // 组件方法与类型-容器 component
 // component 实际上并非为一个组建类
 // 所有的组建类的定义都在其成员_coms中，component的
 // 构造函数通过遍历_coms为自身添加所有构造这些组件的方法
 // 构造组建的方法与组建类名一致
 //=========================================== 
 function component(){
   /*
   // 用于闭包的当前组建类
   var cur_coms;
   // 遍历所有的组建类
   for(var com_name in this._coms){
     cur_coms = this._coms[com_name];
     // 为该组建类添加创建方法
     this[com_name] = function(com_info){
       var test = com_name;
       var new_com = new cur_coms(com_info);
       return new_com;
     }
   }
   */
 }
 
 component.prototype = {
   // 用于创建组件实例
   // @param <string> com_type 组建名称
   // @param <object> com_info 构造组件需要的参数
   // @return <object> 组件实例
   // ex: nyJS.component.create("tip", {option});
   create: function(com_type, com_info){
     var new_com = new this._coms[com_type](com_info);
     return new_com;
   },
   // 组建类列表
   // 每个组建构造函数中均需要调用其父类构造函数：
   // arguments.callee.super.call(this)
   
   _coms: {
     // "tip"组件
     tip: component_base.inherit({
       /**
        * 给定 tip内容，以及相关设置参数构造一个tip组件
        * @param <object> com_info{
        *   text: tip的内容,
        *   tag: 包裹内容的标签，默认为p
        *   class: 标签的类名
        * }
        */
       constructor: function(com_info){
         // 调用父类构造函数
         arguments.callee.super.call(this);
         
         // ====以下为非函数成员变量====
         this.text = "";
         this.tag = "p";
         this.class = "nyJS_com_tip";
         
         // ====以下为构造函数内容====
         
         // 初始化数据
         this.text = com_info.text || this.text;
         this.tag = com_info.tag || this.tag;
         this.class = com_info.class || this.class;
         
         // 构造jq对象，默认将隐藏
         this.base_jq = $("<" + this.tag + " class ='" + this.class + "' >" + this.text + "</" + this.tag + ">").appendTo("body").hide();
         
         // 为组件添加相应事件接口
         this._event.reg({
           jq: this.base_jq,
           type: "click",
           name: "click"
         });
       },
       prototype: {
         // 设置tip内部的文字
         set: function(new_text){
           this.text = new_text;
           this.base_jq.text(new_text);
         },
         // 获取tip的文字
         get: function(){
           return this.text;
         },
         /**
          * 显示tip
          * option参数和jquery中的show()参数一致
          */
         show: function(option){
           this.base_jq.show(option);
         },
         /**
          * 隐藏tip
          * option参数和jquery中的hide()参数一致
          */
         hide: function(option){
           this.base_jq.hide(option);
         }
       }
     }),
     // form 表单组建
     form: component_base.inherit({
       /**
        * form组建构造函数
        * @param <object> com_info{
        *   
        * }
        */
       constructor: function(com_info){
         // 调用父类构造函数
         arguments.callee.super.call(this);
         
         // ====以下为非函数成员变量====
         
         // 用于错误提示的tip类
         this.tag = "p";
         // 用于错误提示的tip类
         this.class = "nyJS_com_form_tip";
         
         // ====以下为构造函数内容====
         
         // 初始化数据
         this.tag = com_info.tag || this.tag;
         this.class = com_info.class || this.class;
         this.base_jq = com_info.jq || this.base_jq;
         
         // 为组件添加相应事件接口
         this._event.reg({
           jq: this.base_jq,
           type: "click",
           name: "submit"
         });
         
         
         var form = this;
         this.controller.response({
           submit: {
             fn_name : "form_submit",
             fn: function(){
               if(!form.check()){
                 return false;
               }
             }
           }
         });
         
       },
       prototype: {
         // 表单对象的表单验证以表单字段的class中是否含有对应关键字来
         // 决定如何进行验证
         // 验证规则放在prototype中, 让所有form实例对象共享这个配置
         // rule: {
         //   msg: 当验证不通过时输出的错误文字,
         //   test: 用于进行验证的函数，返回true或者false
         // }
         // test: function(obj){}, obj为当前验证字段dom对象
         rules: {
           required: {
             msg: "This field is required.",
             test: function(obj){
               return obj.value.length > 0;
             }
           },
           email: {
             msg: "Not a valid email address.",
             test: function(obj){
               // 若value为空则为真，若不为空则验证邮箱是否正确
               return !obj.value || /^[a-z0-9_+.-]+\@([a-z0-9-]+\.)+[a-z0-9]{2,4}$/i.test(obj.value);
             }
           }
         },
         /**
          * 设置表单检查的规则
          * 创建新的规则或者覆盖默认规则
          * @param <object> rules{
          *   required: {
          *     msg: 错误提示,
          *     test: function(){
          *     }
          *   }
          * }
          */
         set_rules: function(rules){
           rules = rules || {};
           for(var i in rules){
             // 若该规则尚未设置
             if(this.rules[i] === undefined){
               this.rules[i] = rules[i];
             }
             // 覆盖默认规则
             else{
               for(var j in rules[i]){
                 this.rules[i][j] = rules[i][j];
               }
             }  
           }
         },
         /**
          * 对表单进行验证
          * @return <boolen> 
          */
         check: function(){
           // 表单验证结果，作为闭包
           var check_result = true;
           
           var rules = this.rules;
           // 用于闭包的form组建对象
           var form = this;
           
           // 考虑到可能jq包含多个表单
           this.base_jq.each(function(){
             var tip;
             // 对表单内的每个字段进行遍历
             for(var i = 0; i < this.elements.length; i++){
               // 若已经存在错误提示， 则隐藏错误提示 tip
               if(this.elements[i].nyJS_tip !== undefined){
                 this.elements[i].nyJS_tip.hide();
               }
               // 对每个规则进行遍历
               for(var j in rules){
                 
                 // 验证该表单字段是否含有响应的类名， 若存在，则进行验证
                 var re = new RegExp("(^|\\s)" + j + "(\\s|$)");
                 if(re.test(this.elements[i].className) && !rules[j].test(this.elements[i])){
                   check_result = false;
                   
                   // 若该字段还没有被 添加 tip组件, 则新建一个tip， 添加到当前字段的dom对象中
                   if(this.elements[i].nyJS_tip === undefined){
                     this.elements[i].nyJS_tip = nyJS.component.create("tip", {
                       tag: form.tag,
                       class: form.class
                     });
                     // 将tip组建放到当前dom对象后面
                     $(this.elements[i]).after(this.elements[i].nyJS_tip.base_jq);
                   }
                   // 设置错误信息
                   this.elements[i].nyJS_tip.set(rules[j].msg);
                   // 显示错误
                   this.elements[i].nyJS_tip.show();
                 }
               }
             }
           });
           return check_result;
         },
         submit: function(){
           this.base_jq.submit();
         }
       }
     })
   }
 };
 

 //===========================================
 // 其他工具函数 Utilities
 //===========================================
 function Utilities(){
 }; 
 Utilities.add_proto({
   /**
    * 用于导入js文件
    * 支持绝对路经和相对路经导入（相对当前js文件）
    * 支持多级嵌套导入
    */
   importJS: function(url){
     var closure_this = this;
     url = this.handle_url(url);
     
     // 下面两句是为了解决嵌套导入的问题，如 A文件中导入了B，B文件中又导入了C
     // 思路是：当A开始进行导入操作时（还未导入成功，但是B文件的绝对路经已经计算出来了以后，将B的绝对路经入栈
     // 这个时候在B中导入C的时候，直接读取栈顶元素（也就是B）作为当前文件路经进行计算C的绝对路经
     // 每次在success和error回调函数中将栈顶元素弹出
     
     // 将url添加到import_stack中
     this.import_stack.push(url);
     
     // 若文件尚未导入过
     if(!this.if_imported(url)){
       $.ajax({
         url: url,
         async: false,
         dataType: "script",
         type: "post",
         success: function(data){
           console.log("JavaScript 文件导入成功，以下为脚本内容！");
           console.log(data);
           // 建导入文件的url添加到 import_list 中
           closure_this.import_list.push(url);
           // 将import_stack上的文件pop掉
           closure_this.import_stack.pop();
         },
         error: function(jqXHR, textStatus, errorThrown){
           console.log("JavaScript 文件导入失败！");
           console.log("textStatus: " + textStatus);
           console.log("errorThrown: " + errorThrown);
           // 将import_stack上的文件pop掉
           closure_this.import_stack.pop();
         }
       });
     }
     else{
       console.log(url + "--- 导入失败，该文件无法重复导入！");
     }
   },
   /**
    * 将相对路经转化为绝对路经
    * 若为绝对路经则直接返回
    */
   handle_url: function(url){
     // 若为完整路经
     if(url.toLowerCase().indexOf("://") > 0 ){
       return url;
     }
     // 若为相对路经
     else{
         // 获取当前文件路经
       var local_path = this.get_local_path();
       // 保存网址协议部分， 以备最后重新构造url的时候使用
       var http_str = local_path.substring(0, local_path.indexOf("://") + 3);
       // 将网址中的协议部分和最后的文件部分去掉
       local_path = local_path.substring(local_path.indexOf("://") + 3, local_path.lastIndexOf("/"));
       // 利用“/”将url分割
       var local_array = local_path.split("/");
       var url_array = url.split("/");
       
       while(url_array.length > 0){
         // 若为".."，则将local_array中最后一个元素pop掉
         if(url_array[0] === ".."){
           local_array.pop();
         }
         // 若不为"..", 则可能为文件名或者路经名，push到local_array中去
         else{
           local_array.push(url_array[0]);
         }
         // 删除url_array的第一个元素
         url_array.splice(0, 1);
       }
     }
    
     // 构造新url
     var url_handled = http_str;
     for(var i = 0; i < local_array.length; i++){
       if(i !== (local_array.length - 1)){
         url_handled += (local_array[i] + "/");
       }
       else{
         url_handled += local_array[i];
       }
     }
     return url_handled;
   },
   /**
    * 获取当前javascript所在文件的绝对路经
    * 通过动态的创建一个script标签，并赋予id，通过定位它来找到当前Script
    * 使用script是为了在head中也可以使用
    * 
    * @return <string> 路经
    */
   get_local_path: function(){
     // 若导入文件栈中还有文件，说明当前导入是在上一个被导入的文件中
     if(this.import_stack.length > 0){
       return this.import_stack[this.import_stack.length - 1];
     }
     // 根据前缀和当前时间戳作为临时 script节点的id
     var timestamp = (new Date()).valueOf();
     var id_prefix = "timestamp_";
     var script_id = id_prefix + timestamp;
     // 添加script
     document.write("<script id=\"" + script_id + "\" ></script>");
     var temp_script = document.getElementById(script_id);
     // 利用新建的script找到当前文件所在scrip
     var _this = temp_script.previousSibling;
     // 删除新建的这个script
     temp_script.parentNode.removeChild(temp_script);
     // 返回路经
     return _this.src;
   },
   /**
    * 检查url是否已经导入
    * 该url需要为被处理过的绝对路经
    * @param <string> url
    * @return <boolen>
    */
   if_imported: function(url){
     for(var i = 0; i < this.import_list.length; i++){
       if(this.import_list[i] === url){
         return true;
       }
     }
     return false;
   },
   /**
    * 用于存储已经导入的文件 防止同一文件重复导入
    */
   import_list: [],
   /**
    * 正在导入的文件栈
    * 用于存放一个文件在导入开始和导入操作完成之间的临时url备份
    * 用于解决多级嵌套导入的问题
    */
   import_stack: []
 });
 
 window.nyJS = {
   model: new model(),
   view: new view(),
   _event: new _event("nyJS"),
   component: new component(),
   utility: new Utilities()
 }
 nyJS.controller = new controller();
 
})(window);
