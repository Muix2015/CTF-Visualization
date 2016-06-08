
/*
 * 进攻测试   随机选取进攻队伍和防守队伍
 */
function attactTest(){
	var startIndex = Math.ceil(Math.random()*15);
	var endIndex;
	do{
		endIndex = Math.ceil(Math.random()*15);
	}while(endIndex == startIndex);
	var serviceNum = Math.ceil(Math.random()*4);
	XCTF.attack(startIndex,endIndex,serviceNum,1800);		
	var time = Math.ceil(Math.random()*3000);
	setTimeout(attactTest,time);		//间隔一段时间后再次调用此函数
}


var stream = {};

function test(){

	var startIndex = Math.ceil(Math.random()*teamsOption.num );
	var endIndex;
	do{
		endIndex = Math.ceil(Math.random()*teamsOption.num );
	}while(endIndex == startIndex);

	stream = {
		timestamp : Date.parse(new Date())/1000,
		attacker : startIndex,
		defender : endIndex,
		service :  Math.ceil(Math.random()*4),
		status :  Math.ceil(Math.random()*2)-1
	}
	XCTF.attack(stream.timestamp,stream.attacker,stream.defender,stream.service,status);		
	var time = Math.ceil(Math.random()*3000);
	setTimeout(test,time);		//间隔一段时间后再次调用此函数
}



jQuery(document).ready(function() {    
   XCTF.init();
   $('.test-btn').click(function(event) {
   		if(XCTF.isReady()){
   			test();
   		}else{
   			alert('还没有加载完成');
   		}
   });
});