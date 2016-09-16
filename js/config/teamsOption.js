	var teamsOption = {

		logoPath : "img/logo/",				//队伍logo所在目录
		logoSize : {						//logo尺寸(单位:像素)
			w : 300,
			h : 300
		},

		serviceNum : 6,

		serviceData : [
			"flag-robot",
			"meng",
			"missle", 
			"oj", 
			"msgstore", 
			"mailbox"
		],

		teamNum : 13,			//队伍数量
		
		teamData :[
			{
			    number : 1,        //队伍编号(从1开始递增)
			    name : "217",      //队伍名称
			    logo : "217.png"   //队伍logo图片名称
			},
			{
			    number : 2,
			    name : "0ops",
			    logo : "Oops.png"
			},
			{
			    number : 3,
			    name : "4",
			    logo : "4.png"
			},
			{
			    number : 4,
			    name : "******",
			    logo : "6star.png"
			},
			{
			    number : 5,
			    name : "天枢",
			    logo : "tianshu.png"
			},
			{
			    number : 6,
			    name : "bamboofox",
			    logo : "bamboofox.png"
			},
			{
			    number : 7,
			    name : "Dawn",
			    logo : "dawnlogo.png"
			},
			{
			    number : 8,
			    name : "FlappyPig",
			    logo : "flappypig.png"
			},
			{
			    number : 9,
			    name : "Freed0m",
			    logo : "Freedom.png"
			},
			{
			    number : 10,
			    name : "l1ght",
			    logo : "l1ght.png"
			},
			{
			    number : 11,
			    name : "ROIS",
			    logo : "rois.png"
			},
			{
			    number : 12,
			    name : "Sigma",
			    logo : "sigma.png"
			},
			{
			    number : 13,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 14,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 15,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 16,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 17,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 18,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 19,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 20,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 21,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 22,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 23,
			    name : "NPC",
			    logo : "13.png"
			},
			{
			    number : 24,
			    name : "NPC",
			    logo : "13.png"
			}
		],

		typeData : [
		    "normal" ,
    		"submission"
		]
	};


function getNumberByTeamName( name ){
	var name = name.toLowerCase();
	for(var i=0;i<teamsOption.teamNum;i++){
		if( teamsOption.teamData[i].name.toLowerCase() == name ){
			return teamsOption.teamData[i].number;
		}
	}
	return -1;
}

function getNumberByServiceName( name ){
	var name = name.toLowerCase();
	for(var i=0;i<teamsOption.serviceNum;i++){
		if( teamsOption.serviceData[i].toLowerCase() == name ){
			return i+1;
		}
	}
	return -1;
}

function getNumberByTypeName( name ){
	var name = name.toLowerCase();
	for(var i=0;i<2;i++){
		if( teamsOption.typeData[i].toLowerCase() == name ){
			return i;
		}
	}
	return -1;
}
