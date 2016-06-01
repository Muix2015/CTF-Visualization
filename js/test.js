
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



jQuery(document).ready(function() {    
   XCTF.init();
   setTimeout(attactTest,1500); // 等待1.5秒（模型加载完成才能执行）
});