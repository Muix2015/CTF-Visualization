##CTF赛况实时3D效果
在线展示: [DEMO](http://lab.hujiulong.com/CTF/)

##初始化
表格初始化 
```javascript
	UI.init();
```

场景初始化
```javascript
	XCTF.init( {
		callback: function () {			//初始化完成后的回调
			...
		},
		progress: {						//进度条
			set: function ( value ) {
				...
			},
			remove: function ( value ) {
				...
			}
		}
	} );
```

## 队伍数据
配置文件: js/config/teamsOption.js

示例:
```javascript
var teamsOption = {

	logoPath : "img/logo/",				//队伍logo所在目录
	logoSize : {						//logo尺寸(单位:像素)
		w : 300,
		h : 300
	},

	serviceNum : 6,                     //服务数量

	serviceData : [                     //服务名称
		"flag-robot",
		"meng",
		"missle", 
		"oj", 
		"msgstore", 
		"mailbox"
	],

	teamNum : 13,                       //队伍数量( 12 - 16 )
	
	teamData :[
		{
		    number : 1,                 //队伍编号(从1开始递增)
		    name : "217",               //队伍名称
		    logo : "217.png"            //队伍logo图片名称
		},
		{
		    number : 2,
		    name : "0ops",
		    logo : "Oops.png"
		},
	  	...                             // 共13项
		...
	]，
	typeData : [                        //攻击状态
	    "normal" ,
		"submission"
	]
}

... 其余代码请勿修改
...

```
